const {
  addVerificationServices,
  getVerificationServices,
  getUserVerificationServices,
  updateVerificationServices,
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
  if (data.requests) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
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
