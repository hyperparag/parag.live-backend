const { Links } = require("../models");

exports.addLinks = async ({ body }) => {
    const response = {
      code: 201,
      status: "success",
      message: "Product added successfully",
    };
  
    try {
      const newProduct = new Links(body);
      await newProduct.save();
      return response;
    } catch (error) {
      console.log(error);
      response.code = 500;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }
  };


  exports.getLinks = async (req, res) => {


    Links.find({})
      .select("-__v -isDelete ")
      .sort({ _id: -1 })
      .lean()
      .exec((error, links) => {
        if (error) return res.status(400).json({ error });
        if (links) {
          res.status(200).json({ links });
        }
      });
  };


  exports.updateLinks = async ({ id, shemale, meet, live, header }) => {
    const response = {
      code: 200,
      status: "success",
      message: "Links updated successfully",
      data: {},
    };

    try {
      const link = await Links.findOne({
        _id: id,
      }).exec();
      if (!link) {
        response.code = 422;
        response.status = "failed";
        response.message = "No User data found";
        return response;
      }

      link.shemale = shemale ? shemale : link.shemale;
      link.meet = meet ? meet : link.meet;
      link.live = live ? live : link.live;
      link.header = header ? header : link.header;

      await link.save();

      response.data.link = link;

      return response;
    } catch (error) {
      console.log(error);
      response.code = 500;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }
  };

  exports.getLinkService = async (req, res) => {
    const link = await Links.findOne({});
    const linkSingle = link.header;
    return linkSingle;
  };