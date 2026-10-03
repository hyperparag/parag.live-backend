const express = require("express");
const crypto = require("crypto");
const { Transactions } = require("../models");
const { increaseUserCredit } = require("../users/services");
const { payReferralBonus } = require("../utils/referral");

const router = express.Router();

/**
 * Verify the BTCPay-Sig header against the raw request body.
 *
 * This endpoint had no verification of any kind: it trusted body.metadata.user_id
 * and body.amountPaid, so anyone who knew the URL could credit any account any
 * amount. Set BTCPAY_WEBHOOK_SECRET to close that. When the secret is unset we
 * log loudly rather than hard-failing, so an existing deployment keeps working
 * until the variable is added.
 */
function verifyBtcPaySignature(req) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[btcpay] BTCPAY_WEBHOOK_SECRET is not set - webhook payloads are UNVERIFIED and spoofable."
    );
    return { ok: true, verified: false };
  }

  const header = req.headers["btcpay-sig"] || req.headers["BTCPay-Sig"];
  if (!header || !req.rawBody) return { ok: false, verified: false };

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

  const a = Buffer.from(String(header));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return { ok: false, verified: false };

  return { ok: crypto.timingSafeEqual(a, b), verified: true };
}

router.post("/", async (req, res) => {
  try {
    const signature = verifyBtcPaySignature(req);
    if (!signature.ok) {
      console.error("[btcpay] rejected webhook with a bad signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const body = req.body;
    console.log("Webhook Event Received:", body?.type, body?.invoiceId);

    if (body.type !== "InvoiceSettled") {
      return res.status(200).json({ message: "Ignored non-settled invoice" });
    }

    const invoiceId = body.invoiceId;
    const userId = body.metadata?.user_id;
    const amountPaid = parseFloat(body.amountPaid);

    if (!userId || !amountPaid) {
      return res.status(400).json({ error: "Missing userId or amountPaid" });
    }

    // One credit per invoice, however many times BTCPay delivers the event.
    const eventId = invoiceId ? `btcpay:${invoiceId}` : undefined;
    if (eventId) {
      const alreadyHandled = await Transactions.findOne({ eventId })
        .select("_id")
        .lean()
        .exec();
      if (alreadyHandled) {
        console.log(`[btcpay] invoice ${invoiceId} already processed, skipping`);
        return res.status(200).json({ message: "Already processed" });
      }
    }

    // Store transaction record
    try {
      const transaction = new Transactions({
        exactAmount: amountPaid,
        amount: amountPaid, // Adjust this if conversion logic is needed
        date: new Date().toISOString(),
        invoice: invoiceId,
        isCompleted: "Done",
        userId,
        isDelete: false,
        kind: "recharge",
        eventId,
      });

      await transaction.save();
    } catch (error) {
      if (error && error.code === 11000) {
        console.log(`[btcpay] invoice ${invoiceId} raced, skipping`);
        return res.status(200).json({ message: "Already processed" });
      }
      throw error;
    }

    // Update user credit
    await increaseUserCredit(userId, amountPaid);

    // Referral payouts only run on a cryptographically verified payload --
    // paying a third party on an unverified webhook would be a real loss.
    if (signature.verified) {
      try {
        await payReferralBonus({
          buyerId: userId,
          paidAmount: amountPaid,
          referralCode: body.metadata?.referral_code,
          eventId,
        });
      } catch (referralError) {
        console.error("[referral] payout failed:", referralError);
      }
    } else {
      console.warn(
        "[referral] skipped payout for an unverified BTCPay webhook; set BTCPAY_WEBHOOK_SECRET to enable it."
      );
    }

    console.log(`User ${userId} credited with ${amountPaid} BTC`);
    return res.status(200).json({ message: "User credited successfully" });
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
