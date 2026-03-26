const {
  addUserService,
  getUsersService,
  searchUserService,
  getUserService,
  deleteUserService,
  updateUserService,
  updatePremiumService,
  updateUserAddressService,
  updatePassordService,
  updateCreditService,
  increaseUserCredit,
  saveUser,
} = require("./services");

// add Users
exports.saveUserController = async (req, res) => {
  const { status, code, message } = await saveUser({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

exports.addUser = async (req, res) => {
  const { status, code, message } = await addUserService({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// update Users
exports.updateUser = async (req, res) => {
  const { status, code, message, data } = await updateUserService({
    ...req.params,
    ...req.body,
  });
  if (data.user) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Users
exports.updateCredit = async (req, res) => {
  const { status, code, message, data } = await updateCreditService({
    ...req.params,
    ...req.body,
    ...req.query,
  });
  if (data.user) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
// update Users
exports.updateUserAddress = async (req, res) => {
  const { status, code, message, data } = await updateUserAddressService({
    ...req.params,
    ...req.body,
  });
  if (data.user) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Users
exports.updatePassword = async (req, res) => {
  const { status, code, message, data } = await updatePassordService({
    ...req.params,
    ...req.body,
  });
  if (data.user) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// delete Users
exports.deleteUser = async (req, res) => {
  const { status, code, message, data } = await deleteUserService({
    ...req.params,
  });
  res.status(code).json({ code, status, message, data });
};

// get all Users
exports.getUsers = async (req, res) => {
  const { status, code, message, data } = await getUsersService({
    ...req.query,
  });

  if (data.users) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get Users by search
exports.searchUser = async (req, res) => {
  const { status, code, message, data } = await searchUserService({
    ...req.query,
  });
  if (data.users && data.users.length > 0) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get one Users
exports.getUser = async (req, res) => {
  const { status, code, message, data } = await getUserService({
    ...req.params,
  });
  if (data.user) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
