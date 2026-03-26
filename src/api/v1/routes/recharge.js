const express = require("express");
const { Client, resources } = require('coinbase-commerce-node');
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
            user_id: id
        },
    };
    try {
        const charge = await resources.Charge.create(chargeData);
        return res.status(200).json(Object.assign({
            redirectURI: charge.hosted_url
        }, charge))
    } catch (ex) {
        console.log(ex)
        return res.status(422).json({ message: 'Could not create charge' })
    }
});

module.exports = router;
