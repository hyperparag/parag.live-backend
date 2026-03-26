const { addLinks, updateLinks, getLinkService } = require("./service");

exports.addLink = async (req, res) => {
  const { status, code, message } = await addLinks({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// update Medias
exports.updateLink = async (req, res) => {
  const { status, code, message, link } = await updateLinks({
    ...req.params,
    ...req.body,
  });
  if (link) {
    return res.status(code).json({ code, status, message, link });
  }
  res.status(code).json({ code, status, message });
};

exports.getLink = async (req, res) => {
  const link = await getLinkService({});
  res.status(200).json(link);
};
