const { Ads } = require("../models");

exports.addAds = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newAd = new Ads(body);
    await newAd.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAds = async (req, res) => {

  Ads.find({})
    .select("-__v -isDelete ")
    .sort({ _id: -1 })
    .lean()
    .exec((error, ads) => {
      if (error) return res.status(400).json({ error });
      if (ads) {
        res.status(200).json({ ads });
      }
    });


    
};


exports.getAdsbyCategory = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  const category = req.query.category

  try {
    const ads = await Ads.find({category : category}).sort({_id : -1}).limit(5)

    res.status(200).json({ads})

  } catch (error) {
    res.send(error)
  }

};

exports.updateAds = async ({ id, image, title, link , category }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  try {
    const ads = await Ads.findOne({
      _id: id,
    }).exec();
    if (!link) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    ads.title = title ? title : ads.title;
    ads.category = category ? category : ads.category;
    ads.image = image ? image : ads.image;
    ads.link = link ? link : ads.link;

    await ads.save();

    response.data.ads = ads;

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};



exports.deleteAds = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const ads = await Ads.findOne({
      _id: id,
      isDelete: false,
    });
    if (!ads) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await ads.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;

  console.log(ids);

  try {
    await Ads.deleteMany(
      {
        _id: {
          $in: ids,
        },
      },
      function (err, result) {
        if (err) {
          res.json(err);
        } else {
          res.json(result);
        }
      }
    );

    res
      .status(200)
      .json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    console.log(e);
    // res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};