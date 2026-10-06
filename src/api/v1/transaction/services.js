const { default: mongoose } = require("mongoose");
const { Transactions, User } = require("../models");

const KINDS = [
  "recharge",
  "ad-spend",
  "repost",
  "referral-bonus",
  "referral-convert",
  "earn-bonus",
  "admin-credit",
];

// Which direction each kind moves the user's posting credit / earnings.
//   credit   - posting credit goes up
//   debit    - posting credit goes down
//   earnings - referral/bonus earnings go up (not yet spendable)
//   convert  - earnings turned into posting credit
const FLOW = {
  recharge: "credit",
  "admin-credit": "credit",
  "ad-spend": "debit",
  repost: "debit",
  "referral-bonus": "earnings",
  "earn-bonus": "earnings",
  "referral-convert": "convert",
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const withFlow = (t) => ({ ...t, flow: FLOW[t.kind] || "credit" });

exports.addTransactionServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Transaction added successfully",
  };

  try {
    const newTransaction = new Transactions(body);
    await newTransaction.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/** Admin: every transaction, searchable by user email / invoice, filterable by kind. */
exports.getTransactionsServices = async ({ q, kind, page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transactions found successfully",
    data: [],
    total: 0,
    startIndex: 1,
  };

  try {
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(size) || 10, 1), 100);
    const skip = (pageNumber - 1) * limit;

    const query = { isDelete: { $ne: true } };
    if (kind && KINDS.includes(kind)) query.kind = kind;

    if (q && String(q).trim()) {
      const regex = new RegExp(escapeRegex(String(q).trim()), "i");
      const users = await User.find({ email: regex }).select("_id").limit(200).lean();
      query.$or = [
        { invoice: regex },
        { userId: { $in: users.map((u) => u._id) } },
      ];
    }

    const [rows, total] = await Promise.all([
      Transactions.find(query)
        .populate("userId", "firstName lastName email")
        .select("-__v -isDelete")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transactions.countDocuments(query),
    ]);

    response.data = rows.map(withFlow);
    response.total = total;
    response.startIndex = skip + 1;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

/** One user's own history plus the totals shown above it. */
exports.getMyTransactionsService = async ({ userId, kind, page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transactions found successfully",
    data: [],
    total: 0,
    summary: {},
  };

  try {
    const uid = mongoose.Types.ObjectId(userId);
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(size) || 10, 1), 100);
    const skip = (pageNumber - 1) * limit;

    const query = { userId: uid, isDelete: { $ne: true } };
    if (kind && KINDS.includes(kind)) query.kind = kind;

    const [rows, total, grouped, user] = await Promise.all([
      Transactions.find(query)
        .select("-__v -isDelete -eventId")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transactions.countDocuments(query),
      Transactions.aggregate([
        { $match: { userId: uid, isDelete: { $ne: true } } },
        { $group: { _id: "$kind", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      User.findById(uid).select("credit referralEarnings referralConverted").lean(),
    ]);

    const by = {};
    grouped.forEach((g) => {
      by[g._id] = round2(g.total);
    });

    response.data = rows.map(withFlow);
    response.total = total;
    response.summary = {
      credit: round2(user?.credit),
      purchased: round2((by.recharge || 0) + (by["admin-credit"] || 0)),
      spent: round2((by["ad-spend"] || 0) + (by.repost || 0)),
      earned: round2((by["referral-bonus"] || 0) + (by["earn-bonus"] || 0)),
      converted: round2(user?.referralConverted),
      available: round2((user?.referralEarnings || 0) - (user?.referralConverted || 0)),
    };
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Transactions
exports.updateTransactionServices = async ({ id, isRead }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transaction  updated successfully",
    data: {},
  };

  try {
    const transactions = await Transactions.findOne({ _id: id }).exec();
    if (!transactions) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Transaction data found";
      return response;
    }

    transactions.isRead = isRead ? isRead : transactions.isRead;
    await transactions.save();
    response.data.transactions = transactions;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteTransactionServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Transaction successfully",
  };

  try {
    // The ledger is a record of money; hide it rather than destroy it.
    const result = await Transactions.updateOne(
      { _id: id, isDelete: { $ne: true } },
      { $set: { isDelete: true } }
    );
    if (!result.matchedCount && !result.n) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Transaction data found";
    }
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.TRANSACTION_KINDS = KINDS;
