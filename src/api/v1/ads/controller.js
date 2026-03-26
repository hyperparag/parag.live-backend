const { addAds, updateAds, deleteAds } = require("./service");

exports.addAd = async (req, res) => {

    const { status, code, message } = await addAds({
      body: req.body,
      ...req.body,
    });
    res.status(code).json({ code, status, message });
  };
  

  // update Medias
  exports.updateAd = async (req, res) => {
    const { status, code, message, link } = await updateAds({
      ...req.params,
      ...req.body,
    });
    if (link) {
      return res.status(code).json({ code, status, message, link });
    }
    res.status(code).json({ code, status, message });
  };


    // update Blogs
    exports.deleteAd = async (req, res) => {
      const { status, code, message } = await deleteAds({
        ...req.params,
      });
      res.status(code).json({ code, status, message });
    };
