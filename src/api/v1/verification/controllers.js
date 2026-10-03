const {
  addVerificationServices,
  getVerificationServices,
  getUserVerificationServices,
  updateVerificationServices,
  deleteVerificationServices,
  deleteManyVerificationServices,
} = require("./services");

exports.addVerification = async (req, res) => {
  const { status, code, message } = await addVerificationServices({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.getVerifications = async (req, res) => {
  const { status, code, message, data } = await getVerificationServices({
    ...req.query,
  });
  // data.requests is always present now, including when it is an empty array.
  res.status(code).json({ code, status, message, data });
};

exports.getUserVerification = async (req, res) => {
  const { status, code, message, data } = await getUserVerificationServices({
    ...req.params,
  });
  res.status(code).json({ code, status, message, data });
};

exports.updateVerification = async (req, res) => {
  const { status, code, message, data } = await updateVerificationServices({
    ...req.params,
    ...req.body,
  });
  if (data.verification) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

exports.deleteVerification = async (req, res) => {
  const { status, code, message, data } = await deleteVerificationServices({
    ...req.params,
  });
  res.status(code).json({ code, status, message, data });
};

exports.deleteManyVerifications = async (req, res) => {
  const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
  const { status, code, message, data } = await deleteManyVerificationServices({
    ids,
  });
  res.status(code).json({ code, status, message, data });
};
