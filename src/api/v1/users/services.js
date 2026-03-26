const { User, Product, Deposit } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { updatedTransactionStatus } = require("../transaction/services");

const generateJwtToken = ({
  _id,
  firstName,
  lastName,
  avater,
  email,
  role,
}) => {
  return jwt.sign(
    { _id, firstName, lastName, avater, email, role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

exports.saveUser = async (req, res) => {
  const { given_name, family_name, email, picture } = req.body;

  try {
    const isExist = await User.findOne({ email: email });

    if (isExist) {
      return res.status(201).json({ message: "success", isExist });
    }
    const data = {
      firstName: given_name,
      lastName: family_name,
      email,
      avater: picture,
      credit: 0,
    };

    const createdUser = await User.create(data);
    return res.status(201).json({ message: "success", isExist: createdUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Invalid" });
  }
};

exports.addUserService = async (req, res) => {
  const { firstName, lastName, email, address, password, avater, month } =
    req.body;
  try {
    const emails = email.toLowerCase();

    User.findOne({ email: emails }).exec(async (error, user) => {
      if (user)
        return res.status(400).json({
          error: "User already registered",
        });

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
      const newUser = new User({
        firstName,
        lastName,
        email: emails,
        month,
        avater,
        password: hashedPassword,
        address,
      });

      await newUser.save();
      return res.status(201).json({ message: "success", newUser });
    });
  } catch (error) {
    res.status(500).json({ message: "Invalid" });
  }
};

exports.signinUsers = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emails = email.toLowerCase();

    const user = await User.findOne({ email: emails });
    if (!user) {
      return res.status(422).json({
        Success: false,
        code: 401,
        message: "User Not Found",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (isPasswordMatched) {
      const token = generateJwtToken({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avater: user.avater,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "success",
        token,
        user,
      });
    } else {
      return res.status(422).json({
        Success: false,
        code: 422,
        message: "Invalid Credential",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({
      Success: false,
      code: 401,
      message: "Invalid Credential",
      error: error,
    });
  }
};

// get all Users
exports.getUsersService = async (req, res) => {
  const { q, page, size } = req.query;

  let query = { isDelete: false };
  if (q !== "undefined" || q !== undefined || q) {
    let regex = new RegExp(q, "i");
    query = {
      ...query,
      $or: [{ firstName: regex }, { email: regex }, { lastName: regex }],
    };
  }

  const totalDocuments = await User.countDocuments({});
  const pageNumber = page ? parseInt(page) : 1;
  const limit = size ? parseInt(size) : 10;
  const skipCount = (pageNumber - 1) * limit;

  const users = await User.find(query)
    .sort({ _id: -1 })
    .skip(skipCount)
    .limit(limit);

  const startIndex = skipCount + 1;
  const endIndex = skipCount + users.length;

  res.status(200).json({ users, totalDocuments, startIndex });
};

// update Users
exports.updateUserAddressService = async ({
  id,
  city,
  zipCode,
  regionName,
  country,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  console.log(id, city, zipCode, regionName, country);
  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!User) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    user.address.country = country ? country : user.address.country;
    user.address.zipCode = zipCode ? zipCode : user.address.zipCode;
    user.address.city = city ? city : user.address.city;
    user.address.regionName = regionName ? regionName : user.address.regionName;

    await user.save();

    response.data.user = user;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateUserService = async ({
  id,
  firstName,
  lastName,
  email,
  phone,
  avater,
  credit,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!User) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    user.firstName = firstName ? firstName : user.firstName;
    user.lastName = lastName ? lastName : user.lastName;
    user.email = email ? email : user.email;
    user.phone = phone ? phone : user.phone;
    user.avater = avater ? avater : user.avater;

    if (credit == 0) {
      user.credit = 0;
    }

    user.credit = parseFloat(credit)
      ? parseFloat(credit)
      : parseFloat(user.credit);

    await user.save();

    response.data.user = user;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateCreditService = async ({ id, credit, isUpdate }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  console.log(isUpdate);

  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!User) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    user.credit = parseFloat(user.credit) + parseFloat(credit);

    await user.save();

    response.data.user = user;

    if (isUpdate) {
      const filter = { _id: isUpdate };
      const update = { status: "completed" };
      const depo = await Deposit.findOneAndUpdate(filter, update, {
        new: true,
      });
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Users
exports.updatePassordService = async ({ id, password, oldPassword }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User updated successfully",
    data: {},
  };

  try {
    const user = await User.findOne({
      _id: id,
    }).exec();
    if (!user) {
      response.code = 422;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

    if (isPasswordMatched) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword ? hashedPassword : user.password;

      await user.save();

      response.data.user = user;

      return response;
    } else {
      response.code = 422;
      response.status = "failed";
      response.message = "Old pass is wrong";
      return response;
    }
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// delete Users
exports.deleteUserService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete User successfully",
  };

  try {
    const user = await User.findOne({
      _id: id,
      isDelete: false,
    });
    if (!user) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }

    await user.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get Users by search
exports.searchUserService = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User data found successfully",
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

    response.data.Users = await User.find(query)
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.Users.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Users by id
exports.getUserService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled User successfully",
    data: {},
  };

  console.log(id);

  try {
    response.data.user = await User.findOne({
      _id: id,
      isDelete: false,
    })
      .select("-__v -isDelete")
      .exec();

    if (!response.data.user) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User found";
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

exports.increaseUserCredit = async (id, amount) => {
  const user = await User.findOne({
    _id: id,
  }).exec();

  user.credit = user.credit ? parseFloat(user.credit) + amount : amount;

  await user.save();
};
