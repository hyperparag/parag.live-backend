// const { Category } = require("../models");

// function createCategories(categories, parentId = null) {
//   const categoryList = [];
//   let category;
//   if (parentId == null) {
//     category = categories.filter((cat) => cat.parentId == undefined);
//   } else {
//     category = categories.filter((cat) => cat.parentId == parentId);
//   }

//   for (let cate of category) {
//     categoryList.push({
//       _id: cate._id,
//       name: cate.name,
//       slug: cate.slug,
//       parentId: cate.parentId,
//       type: cate.type,
//       children: createCategories(categories, cate._id),
//     });
//   }

//   return categoryList;
// }

// // add category
// exports.addCategoryServices = async ({ body }) => {
//   const response = {
//     code: 201,
//     status: "success",
//     message: "Category Added Successfully",
//   };
//   try {
//     const newCategory = new Category(body);
//     console.log(body);
//     newCategory.name = body.name;
//     await newCategory.save();
//     return response;
//   } catch (error) {
//     console.log(error);
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };

// // get all category
// exports.getCategoriesServices = async ({ page, size }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "All Category List Founded",
//   };

//   try {
//     const pageNumber = parseInt(page) || 1;
//     const limit = parseInt(size) || 5;

//     const totalDocuments = await Category.countDocuments({
//       isDelete: false,
//     });
//     const totalPage = Math.ceil(totalDocuments / limit);

//     const category = await Category.find({ isDelete: false })
//       .select("-__v -isDelete")
//       .sort({ _id: -1 })
//       .skip((pageNumber - 1) * limit)
//       .limit(limit)
//       .lean();

//     if (category.length === 0) {
//       response.code = 404;
//       response.status = "failded";
//       response.message = "No category data found";
//       return response;
//     }

//     response.data = {
//       category,
//       currentPage: pageNumber,
//       totalDocuments,
//       totalPage,
//     };

//     return response;
//   } catch (error) {
//     console.log(error);
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };

// // update Category
// exports.updateCategoryService = async ({
//   id,
//   name,
//   nameBn,
//   desc,
//   updatedBy,
// }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "Category updated successfully",
//     data: {},
//   };

//   try {
//     const category = await Category.findOne({
//       _id: id,
//       isDelete: false,
//     }).exec();

//     if (!category) {
//       response.code = 422;
//       response.status = "failed";
//       response.message = "No category data found";
//       return response;
//     }

//     category.name = name ? name : category.name;
//     category.nameBn = nameBn ? nameBn : category.nameBn;
//     category.desc = desc ? desc : category.desc;
//     category.updatedBy = updatedBy ? updatedBy : category.updatedBy;

//     await category.save();

//     response.data.category = category;
//     return response;
//   } catch (error) {
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };

// // get one category by id
// exports.getCategoryService = async ({ id }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "Fetch deatiled category successfully",
//     data: {},
//   };

//   try {
//     response.data.category = await Category.findOne({
//       _id: id,
//       isDelete: false,
//     })
//       .select("-__v -isDelete")
//       .exec();

//     if (!response.data.category) {
//       response.code = 404;
//       response.status = "failed";
//       response.message = "No category found";
//       return response;
//     }

//     return response;
//   } catch (error) {
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };

// // get Category by search
// exports.searchCategoryService = async ({ q }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "category data found successfully",
//     data: {},
//   };

//   try {
//     let query = { isDelete: false };
//     if (q !== "undefined" || q !== undefined || q) {
//       let regex = new RegExp(q, "i");
//       query = {
//         ...query,
//         $or: [{ name: regex }, { nameBn: regex }, { desc: regex }],
//       };
//     }

//     response.data.category = await Category.find(query)
//       .select("-__v -isDelete")
//       .sort({ _id: -1 });

//     if (response.data.category.length === 0) {
//       response.code = 404;
//       response.status = "failed";
//       response.message = "No category data found";
//     }

//     return response;
//   } catch (error) {
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };

// // delete category
// exports.deleteCategoryService = async ({ id }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "Delete category successfully",
//   };
//   console.log(id);
//   try {
//     const category = await Category.findOne({
//       _id: id,
//       isDelete: false,
//     });
//     if (!category) {
//       response.code = 404;
//       response.status = "failed";
//       response.message = "No category data found";
//       return response;
//     }

//     category.isDelete = true;
//     category.deletedAt = Date.now();
//     await category.save();

//     return response;
//   } catch (error) {
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again";
//     return response;
//   }
// };
