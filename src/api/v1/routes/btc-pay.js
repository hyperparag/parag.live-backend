const express = require("express");
const { validateReferralCode } = require("../utils/referral");
const router = express.Router();

// node-fetch was required here but is not a declared dependency -- it only
// resolved as a hoisted transitive dep, and because app.js eagerly requires
// every route file, the day it resolved to v3 (ESM-only) the entire backend
// would fail to boot. Node 18+ has fetch built in.

// These were hardcoded in source. Env wins; the literals remain as a fallback
// so BTCPay keeps working until the variables are set. Rotate the key and drop
// the fallbacks once the env vars are in place.
const BTCPAY_HOST = process.env.BTCPAY_HOST || "https://pay.withbitcoin.org";
const STORE_ID =
  process.env.BTCPAY_STORE_ID ||
  "CcUtt7DYianKdNBpwi9tszdg4Pg2W386JdVbphuDKbKB";
const API_KEY =
  process.env.BTCPAY_API_KEY || "353e7c7f9b108e3c7b9580453fbe1a04d8ab52d7";

router.post("/", async (req, res) => {
  try {
    const { amount, user_id, currency = "USD", referralCode } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate the referral code before sending the buyer off to pay.
    const referral = await validateReferralCode({
      code: referralCode,
      buyerId: user_id,
    });
    if (!referral.valid) {
      return res.status(422).json({ error: referral.reason });
    }

    const response = await fetch(
      `${BTCPAY_HOST}/api/v1/stores/${STORE_ID}/invoices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${API_KEY}`,
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency,
          metadata: {
            user_id: user_id,
            referral_code: referral.code ?? "",
          },
          checkout: {
            speedPolicy: "MediumSpeed",
            redirectURL: `https://parag.live/payment-success`,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BTCPay API Error:", errorText);
      return res
        .status(response.status)
        .json({ error: "Failed to create invoice" });
    }

    const invoice = await response.json();
    res.json(invoice);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
