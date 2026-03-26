const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  const mappedErrors = {};

  if (Object.keys(errors.errors).length === 0) {
    next();
  } else {
    errors.errors.map((e) => {
      mappedErrors[e.param] = e.msg;
    });
    return res.status(422).json(mappedErrors);
  }
};
