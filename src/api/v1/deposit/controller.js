const {
  addDepositService,
  getDepositService,
  updateStatusService,
  getDepositService2,
} = require("./service");

exports.addDeposit = async (req, res) => {
  const { status, code, message } = await addDepositService({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.getDeposits = async (req, res) => {
  const { status, code, message, deposits, total, startIndex } =
    await getDepositService({
      ...req.query,
    });
  if (deposits) {
    return res
      .status(code)
      .json({ code, status, message, deposits, total, startIndex });
  }
  res.status(code).json({ code, status, message });
};
exports.getDeposits2 = async (req, res) => {
  const { status, code, message, deposits, total, startIndex } =
    await getDepositService2({
      ...req.query,
      ...req.params,
    });
  if (deposits) {
    return res
      .status(code)
      .json({ code, status, message, deposits, total, startIndex });
  }
  res.status(code).json({ code, status, message });
};

exports.updateStatus = async (req, res) => {
  const { status, code, message, deposit } = await updateStatusService({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  if (deposit) {
    return res.status(code).json({ code, status, message, deposit });
  }
  res.status(code).json({ code, status, message });
};
