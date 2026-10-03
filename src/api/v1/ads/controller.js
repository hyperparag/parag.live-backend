const { addAds, updateAds, deleteAds } = require("./service");

exports.addAd = async (req, res) => {
  const { status, code, message, data } = await addAds({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message, data });
};

// update side ad
exports.updateAd = async (req, res) => {
  const { status, code, message, data, link } = await updateAds({
    ...req.params,
    ...req.body,
  });
  res.status(code).json({ code, status, message, data, link });
};

// delete side ad
exports.deleteAd = async (req, res) => {
  const { status, code, message } = await deleteAds({
    ...req.params,
  });
  res.status(code).json({ code, status, message });
};
