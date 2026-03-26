

const Category = require("./Model");


function createCategories(categories, parentId = null) {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      parentId: cate.parentId,
      createdBy: cate.createdBy,
      createdAt: cate.createdAt,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}


exports.addCategory = async (req, res) => {

  const categoryObj = {
    name: req.body.name,
    createdBy: req.body.createdBy,
    createdAt: req.body.createdAt,
    parentId: req.body.parentId,
    isDelete: false,
  };


  if (req.body.parentId) {
    categoryObj.parentId = req.body.parentId;
  }

  const cat = new Category(categoryObj);
  cat.save((error, category) => {
    if (error) return res.status(400).json({ error });
    if (category) {
      return res.status(201).json({ category });
    }
  });
};



exports.getCategories = async (req, res) => {
  const { q} = req.query;
  let query = { isDelete: false };
  if (q !== "undefined" || q !== undefined || q) {
    let regex = new RegExp(q, "i");
    query = {
      ...query,
      $or: [{ name: regex }],
    };
  }
 
  Category.find(query)
    .select("-__v -isDelete")
    .exec((error, categories) => {
      if (error) return res.status(400).json({ error });
      if (categories) {
        const categoryList = createCategories(categories);
        res
          .status(200)
          .json({ categoryList });
      }
    });
};





exports.updateCategories = async (req, res) => {
  const { name, tax, commission ,measurement } = req.body;
  const { id } = req.params;

  const response = {
    code: 200,
    status: "success",
    message: "Category updated successfully",
  };

  try {
    const category = await Category.findOne({
      _id: id,
      isDelete: false,
    }).exec();

    if (!category) {
      response.code = 422;
      response.status = "failed";
      response.message = "No category data found";
      return response;
    }

    category.name = name ? name : category.name;
    category.measurement = measurement ? measurement : category.measurement;
    category.tax = tax ? tax : category.tax;
    category.commission = commission ? commission : category.commission;

    await category.save();

    res.send(category);
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// delete category
exports.deleteCategories = async (req, res) => {
  const {id} = req.params;

  const response = {
    code: 200,
    status: "success",
    message: "Delete category successfully",
  };
 
  try {
    const category = await Category.findById({_id: id});
    if (!category) {
      response.code = 404;
      response.status = "failed";
      response.message = "No category data found";
      return response;
    }

    await category.remove();
    res.send(category)

  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getOneCategory = async (req, res) => {

  const {id} = req.params;
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled product successfully",
  };

  try {
    const category = await Category
      .find({_id: id})
      .select("-__v -isDelete")
      .exec();

  
    if (!category) {
      response.code = 404;
      response.status = "failed";
      response.message = "No product found";
      return response;
    }

    res.send(category)

  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};