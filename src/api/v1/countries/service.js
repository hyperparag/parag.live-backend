const { Country } = require("../models");

function createCategories(categories, parentId = null) {

  const countryList = [];
  let category;


  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cate of category) {
    countryList.push({
      _id: cate._id,
      name: cate.name,
      parentId: cate.parentId,
      children: createCategories(categories, cate._id),
    });
  }

  return countryList;
}

// get all Medias
exports.getMediasService = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Media Got successfully",
  };

  try {

    const { q } = req.query;

   

    let query = { isDelete: false };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,

        $or: [{ name: regex }],
      };
    }
 
    Country.find({})
      .select("-__v ").sort()
      .exec((error, categories) => {

        if (error) return res.status(400).json({ error });
        if (categories) {
          const countryList = createCategories(categories);
          res.status(200).json({ countryList });
        }
      });

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};



// get all Medias
exports.getSearchService = async (req , res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Media Got successfully",
    data : {}
  };

    const { q } = req.query;
	


  try {

    let query = { isDelete: false };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [{ name: regex } ],
      };
    }

    const country = await Country.find(query)
       .populate("parentId")
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (country.length === 0) {
      res.status(404).json({message : "Not found any city" , code : 404});
	  return 
    }
	
    res.status(200).json( country);
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again sdf";
    return response;
  }
};



// add Medias
exports.addCountryService = async (req, res) => {
  const categoryObj = {
    name: req.body.name,
    isDelete: false,
    parentId: req.body.parentId,
  };

  if (req.body.parentId) {
    categoryObj.parentId = req.body.parentId;
  }

  const cat = new Country(categoryObj);
  cat.save((error, category) => {
    if (error) return res.status(400).json({ error });
    if (category) {
      return res.status(201).json({ category });
    }
  });
};






// update Medias
exports.updateMediaService = async ({
  id,
  name,
  type,
  description,
  subject,
  image,
  videoLink,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Media updated successfully",
    data: {},
  };

  try {
    const media = await Country.findOne({
      _id: id,
      isDelete: false,
    }).exec();
    if (!media) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Media data found";
      return response;
    }

    media.name = name ? name : media.name;
    media.type = type ? type : media.type;
    media.description = description ? description : media.description;
    media.subject = subject ? subject : media.subject;
    media.videoLink = videoLink ? videoLink : media.videoLink;
    media.image = image ? image : media.image;

    await media.save();

    response.data.media = media;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// delete Medias
exports.deleteMediaService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Media successfully",
  };

  try {
    const media = await Country.findOne({
      _id: id,
      isDelete: false,
    });
    if (!media) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Media data found";
      return response;
    }

    await media.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get Medias by search
exports.searchMediaService = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Media data found successfully",
    data: {},
  };

  try {
    let query = { isDelete: false };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [{ name: regex }, { category: regex }],
      };
    }

    response.data.medias = await Media.find(query)
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.Medias.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Media data found";
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Medias by id
exports.getMediaService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Media successfully",
    data: {},
  };

  try {
    response.data.media = await Media.findOne({
      _id: id,
      isDelete: false,
    })
      .select("-__v -isDelete")
      .exec();

    if (!response.data.media) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Media found";
      return response;
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
