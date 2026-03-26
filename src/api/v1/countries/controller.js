const {  addMediaService , getMediasService  , searchMediaService , getMediaService , deleteMediaService , updateMediaService, getSearchService } = require("./service")

// add Medias
exports.addMedia = async (req, res) => {

    const { status, code, message } = await addMediaService({
      body: req.body,
      ...req.body,
    });
    res.status(code).json({ code, status, message });
  };
  

  // update Medias
  exports.updateMedia = async (req, res) => {
    const { status, code, message, data } = await updateMediaService({
      ...req.params,
      ...req.body,
    });
    if (data.media) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };
  

// delete Medias
  exports.deleteMedia = async (req, res) => {
    const { status, code, message, data } = await deleteMediaService({
      ...req.params,
    });
    res.status(code).json({ code, status, message, data });
  };
  

  // get all Medias
  exports.getMedias = async (req, res) => {
    
    const { status, code, message, data } = await getMediasService({
      ...req.query,
    });
    if (data) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };

  // get all Medias
  exports.getSearch = async (req, res) => {
    console.log("Asdf" , req.query)
    const { status, code, message, data } = await getSearchService({
      ...req.query,
    });

    if (data) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };
  

  // get Medias by search
  exports.searchMedia = async (req, res) => {
    const { status, code, message, data } = await searchMediaService({
      ...req.query,
    });
    if (data.medias && data.medias.length > 0) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };
  

  // get one Medias
  exports.getMedia = async (req, res) => {
    const { status, code, message, data } = await getMediaService({
      ...req.params,
    });
    if (data.media) {
      return res.status(code).json({ code, status, message, data });
    }
    res.status(code).json({ code, status, message });
  };