const express = require("express");
const { Client, resources } = require('coinbase-commerce-node');
const { validateReferralCode } = require("../utils/referral");
const router = express.Router();

router.post("/:id", async (req, res) => {
    const id = req.params.id;
    let amount = req.body.amount;
    if (!amount) {
        return res.status(422).json({ message: 'Amount is required' })
    }
    amount = parseFloat(amount)
    if (amount <= 0) {
        return res.status(422).json({ message: 'Amount must be greater than 0' })
    }

    // Optional referral code. Checked here so an invalid code is reported before
    // the buyer is sent off to pay, rather than silently dropped afterwards.
    const referral = await validateReferralCode({
        code: req.body.referralCode,
        buyerId: id,
    });
    if (!referral.valid) {
        return res.status(422).json({ message: referral.reason })
    }

    const coinbaseApiKey = process.env.COINBASE_API_TOKEN;

    Client.init(coinbaseApiKey);
    const chargeData = {
        name: 'Recharge',
        description: 'Recharge',
        local_price: {
            amount,
            currency: 'USD',
        },
        pricing_type: 'fixed_price',
        metadata: {
            user_id: id,
            // Carried through to the webhook, which is the only place we can
            // trust that the money actually arrived.
            referral_code: referral.code ?? '',
        },
    };
    try {
        const charge = await resources.Charge.create(chargeData);
        return res.status(200).json(Object.assign({
            redirectURI: charge.hosted_url,
            referralApplied: Boolean(referral.code),
        }, charge))
    } catch (ex) {
        console.log(ex)
        return res.status(422).json({ message: 'Could not create charge' })
    }
});

module.exports = router;
