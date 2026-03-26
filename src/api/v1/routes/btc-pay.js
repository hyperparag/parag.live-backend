const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const BTCPAY_HOST = "https://pay.withbitcoin.org";
const STORE_ID = "CcUtt7DYianKdNBpwi9tszdg4Pg2W386JdVbphuDKbKB";
const API_KEY = "353e7c7f9b108e3c7b9580453fbe1a04d8ab52d7";

router.post("/", async (req, res) => {
  try {
    const { amount, user_id, currency = "USD" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing required fields" });
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
          metadata: { user_id: user_id },
          checkout: {
            speedPolicy: "MediumSpeed",
            redirectURL: `https://skipthegames.bio/payment-success`,
          },
        }),
      }
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
