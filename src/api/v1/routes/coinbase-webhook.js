const express = require("express");
const { Webhook } = require("coinbase-commerce-node");
const { increaseUserCredit } = require("../users/services");
const { payReferralBonus } = require("../utils/referral");
const { Transactions } = require("../models");
const router = express.Router();

router.post("/", async (req, res) => {
  const rawBody = req.rawBody;
  const signature = req.headers["x-cc-webhook-signature"];
  const webhookSecret = process.env.WEBHOOK_TOKEN;
  try {
    const event = Webhook.verifyEventBody(rawBody, signature, webhookSecret);

    if (event.type === "charge:confirmed") {
      const user_id = event.data.metadata.user_id;
      const paidAmount = parseFloat(event.data.pricing.local.amount);

      let amount = 0;

      if (event.data.pricing.local.amount == 100) {
        amount = 120;
      } else if (event.data.pricing.local.amount == 200) {
        amount = 250;
      } else if (event.data.pricing.local.amount == 500) {
        amount = 650;
      } else if (event.data.pricing.local.amount == 1000) {
        amount = 1500;
      } else {
        amount = event.data.pricing.local.amount;
      }

      const date = new Date().toDateString();
      const isCompleted = "Done";
      const invoice =
        Math.floor(Math.random() * 500) * 10 +
        user_id +
        Math.floor(Math.random() * 500) * 10;

      // Coinbase can deliver the same event more than once. Without this guard
      // a redelivery credited the buyer twice, and would now also pay the
      // referrer twice.
      const alreadyHandled = await Transactions.findOne({ eventId: event.id })
        .select("_id")
        .lean()
        .exec();

      if (alreadyHandled) {
        console.log(`[coinbase] event ${event.id} already processed, skipping`);
        return res.send(`success ${event.id}`);
      }

      const transaction = {
        exactAmount: paidAmount,
        amount,
        date,
        invoice,
        isCompleted,
        userId: user_id,
        isDelete: false,
        kind: "recharge",
        eventId: event.id,
      };

      try {
        const newTransaction = new Transactions(transaction);
        await newTransaction.save();
      } catch (error) {
        // A concurrent redelivery won the race for this event id.
        if (error && error.code === 11000) {
          console.log(`[coinbase] event ${event.id} raced, skipping`);
          return res.send(`success ${event.id}`);
        }
        throw error;
      }

      await increaseUserCredit(user_id, parseFloat(amount));

      // 50% of what the buyer actually paid goes to whoever referred them.
      // Never let a referral failure fail the whole webhook: the buyer has paid
      // and must be credited regardless.
      try {
        await payReferralBonus({
          buyerId: user_id,
          paidAmount,
          referralCode: event.data.metadata.referral_code,
          eventId: event.id,
        });
      } catch (referralError) {
        console.error("[referral] payout failed:", referralError);
      }
    }

    res.send(`success ${event.id}`);
  } catch (error) {
    console.log(error);
    res.status(400).send("failure!");
  }
});

module.exports = router;
