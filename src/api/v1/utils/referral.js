/**
 * Referral payouts.
 *
 * When somebody buys credits using another user referral code, the referrer
 * receives REFERRAL_SHARE (50%) of the amount actually paid, as referral
 * earnings. The referrer can later convert earnings into posting credit.
 * The share is taken from what the buyer paid, not from the bonus-inflated
 * credit they received, so a $100 purchase that grants 120 credits still pays
 * the referrer $50 worth.
 */
const { User, Transactions } = require("../models");
const { REFERRAL_SHARE } = require("../config/pricing");

/**
 * Resolve a referral code to a user, rejecting the cases that would let someone
 * farm their own code.
 */
async function resolveReferrer({ code, buyerId }) {
  if (!code) return null;

  const referrer = await User.findOne({
    referralCode: String(code).trim().toUpperCase(),
    isDelete: false,
  })
    .select("_id referralCode")
    .exec();

  if (!referrer) return null;
  if (String(referrer._id) === String(buyerId)) return null; // own code

  return referrer;
}

/**
 * Validate a code before a charge is created, so the buyer finds out at checkout
 * rather than after paying.
 */
async function validateReferralCode({ code, buyerId }) {
  if (!code) return { valid: true, code: null, referrerId: null };

  const referrer = await resolveReferrer({ code, buyerId });
  if (!referrer) {
    return { valid: false, reason: "That referral code is not valid.", code: null, referrerId: null };
  }

  return {
    valid: true,
    code: referrer.referralCode,
    referrerId: String(referrer._id),
  };
}

/**
 * Credit a referrer for one confirmed purchase.
 *
 * `eventId` makes this idempotent: the payment webhooks have no replay
 * protection, and a replayed event that pays a third party is a real loss, not
 * just a double self-credit. The unique sparse index on Transactions.eventId is
 * what actually enforces it.
 */
async function payReferralBonus({ buyerId, paidAmount, referralCode, eventId }) {
  const paid = parseFloat(paidAmount);
  if (!buyerId || !Number.isFinite(paid) || paid <= 0) return null;

  const buyer = await User.findById(buyerId).select("_id referredBy").exec();
  if (!buyer) return null;

  // An explicit code on this purchase wins; otherwise fall back to whoever the
  // buyer was already attributed to, so repeat purchases keep paying them.
  let referrer = await resolveReferrer({ code: referralCode, buyerId });
  if (!referrer && buyer.referredBy) {
    referrer = await User.findOne({ _id: buyer.referredBy, isDelete: false })
      .select("_id referralCode")
      .exec();
  }
  if (!referrer) return null;

  const bonus = Math.round(paid * REFERRAL_SHARE * 100) / 100;
  if (bonus <= 0) return null;

  const scopedEventId = eventId ? `referral:${eventId}` : undefined;

  // Claim the event id first. If another delivery of the same event already
  // claimed it, the unique index rejects this insert and we stop here.
  if (scopedEventId) {
    const already = await Transactions.findOne({ eventId: scopedEventId })
      .select("_id")
      .lean()
      .exec();
    if (already) {
      console.log(`[referral] event ${eventId} already paid, skipping`);
      return null;
    }
  }

  try {
    await Transactions.create({
      userId: referrer._id,
      amount: bonus,
      exactAmount: bonus,
      isCompleted: "Done",
      date: new Date().toDateString(),
      invoice: `REF-${referrer.referralCode}-${Date.now()}`,
      kind: "referral-bonus",
      reference: String(buyerId),
      eventId: scopedEventId,
      isDelete: false,
    });
  } catch (error) {
    // Duplicate key means a concurrent delivery won the race; that is fine.
    if (error && error.code === 11000) {
      console.log(`[referral] event ${eventId} raced, skipping`);
      return null;
    }
    throw error;
  }

  // The bonus is recorded as earnings only. The referrer converts it to posting
  // credit themselves via convertReferralEarnings(). $inc rather than
  // read-modify-write, so concurrent payouts cannot clobber each other.
  await User.updateOne(
    { _id: referrer._id },
    { $inc: { referralEarnings: bonus } }
  );

  // Attribute the buyer on first use so later purchases pay the same referrer.
  if (!buyer.referredBy) {
    await User.updateOne({ _id: buyer._id }, { $set: { referredBy: referrer._id } });
  }

  console.log(
    `[referral] paid ${bonus} to ${referrer._id} for purchase of ${paid} by ${buyerId}`
  );

  return { referrerId: String(referrer._id), bonus };
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Move referral earnings into posting credit.
 *
 * `amount` omitted means "everything available". The balance check and both
 * increments happen in one atomic update, so two simultaneous requests cannot
 * convert the same earnings twice.
 */
async function convertReferralEarnings({ userId, amount }) {
  const user = await User.findOne({ _id: userId, isDelete: false })
    .select("referralEarnings referralConverted")
    .lean()
    .exec();
  if (!user) return { ok: false, code: 404, message: "User not found" };

  const available = round2((user.referralEarnings || 0) - (user.referralConverted || 0));

  let convert;
  if (amount === undefined || amount === null || amount === "") {
    convert = available;
  } else {
    convert = round2(Number(amount));
    if (!Number.isFinite(convert) || convert <= 0) {
      return { ok: false, code: 422, message: "Enter a valid amount to convert." };
    }
  }

  if (convert <= 0 || convert > available) {
    return {
      ok: false,
      code: 422,
      message:
        available <= 0
          ? "You have no referral earnings to convert."
          : `You can convert up to $${available.toFixed(2)}.`,
    };
  }

  const updated = await User.findOneAndUpdate(
    {
      _id: userId,
      $expr: {
        $gte: [
          {
            $subtract: [
              { $ifNull: ["$referralEarnings", 0] },
              { $ifNull: ["$referralConverted", 0] },
            ],
          },
          convert - 0.000001,
        ],
      },
    },
    { $inc: { credit: convert, referralConverted: convert } },
    { new: true }
  ).exec();

  if (!updated) {
    return { ok: false, code: 409, message: "Your balance changed. Please try again." };
  }

  await Transactions.create({
    userId,
    amount: convert,
    exactAmount: convert,
    isCompleted: "Done",
    date: new Date().toDateString(),
    invoice: `REFCONV-${Date.now()}`,
    kind: "referral-convert",
    isDelete: false,
  });

  return {
    ok: true,
    code: 200,
    converted: convert,
    credit: updated.credit,
    available: round2((updated.referralEarnings || 0) - (updated.referralConverted || 0)),
  };
}

module.exports = {
  convertReferralEarnings,
  resolveReferrer,
  validateReferralCode,
  payReferralBonus,
};
