const {
  addDepositService,
  getDepositService,
  updateStatusService,
  getDepositService2,
  deleteDepositService,
  deleteManyDepositsService,
} = require("./service");

exports.addDeposit = async (req, res) => {
  const { status, code, message } = await addDepositService({
    body: req.body,
    authUserId: req.decoded?._id,
    authEmail: req.decoded?.email,
  });
  res.status(code).json({ code, status, message });
};

exports.deleteDeposit = async (req, res) => {
  const { status, code, message } = await deleteDepositService({
    ...req.params,
  });
  res.status(code).json({ code, status, message });
};

exports.deleteManyDeposits = async (req, res) => {
  const { status, code, message, deleted } = await deleteManyDepositsService({
    ids: req.body?.ids,
  });
  res.status(code).json({ code, status, message, deleted });
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
