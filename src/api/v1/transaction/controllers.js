const {
  addTransactionServices,
  getTransactionsServices,
  getMyTransactionsService,
  updateTransactionServices,
  deleteTransactionServices,
} = require("./services");

exports.addTransaction = async (req, res) => {
  const { status, code, message } = await addTransactionServices({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// Admin: all transactions.
exports.getTransaction = async (req, res) => {
  const { status, code, message, data, total, startIndex } =
    await getTransactionsServices({ ...req.query });
  res.status(code).json({ code, status, message, data, total, startIndex });
};

// The signed-in user's own history. The id comes from the token, never the URL.
exports.getMyTransactions = async (req, res) => {
  const { status, code, message, data, total, summary } =
    await getMyTransactionsService({
      userId: req.decoded?._id,
      ...req.query,
    });
  res.status(code).json({ code, status, message, data, total, summary });
};

exports.updateTransactions = async (req, res) => {
  const { status, code, message, data } = await updateTransactionServices({
    ...req.params,
    ...req.body,
  });
  if (data.transactions) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

exports.deleteTransaction = async (req, res) => {
  const { status, code, message } = await deleteTransactionServices({
    ...req.params,
  });
  res.status(code).json({ code, status, message });
};
