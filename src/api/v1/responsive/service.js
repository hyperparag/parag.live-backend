const { default: mongoose } = require("mongoose");
const { Responsive } = require("../models");

exports.addLinks = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newProduct = new Responsive(body);
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

exports.getLinksResponsive = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links Found successfully",
    links: {},
  };
  response.links = await Responsive.findOne({
    _id: "66689fbab312cb5061e3f771",
  });

  res.send({ response });
};

exports.updateLinks = async (updateFields) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  try {
    const { id, ...data } = updateFields;
    const result = await Responsive.findByIdAndUpdate(
      {
        _id: id,
      },
      data,
      {
        new: true,
      }
    );

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

