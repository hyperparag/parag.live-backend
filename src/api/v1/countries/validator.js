const mongoose = require('mongoose');
const { check, param } = require('express-validator');

const validatePhone = require('../utils/validatePhone');
const validateEmail = require('../utils/validateEmail');

exports.addMerchantValidator = [
  check('name').trim().notEmpty().withMessage('Name is required'),

  check('nameBn').trim().notEmpty().withMessage('Bengali name is required'),

  check('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(async (phone) => {
      if (phone) {
        const invalidPhone = validatePhone(phone);
        if (invalidPhone) {
          throw invalidPhone;
        }
      }
    }),

  check('secondaryPhone')
    .trim()
    .custom(async (secondaryPhone) => {
      if (secondaryPhone) {
        const invalidPhone = validatePhone(secondaryPhone);
        if (invalidPhone) {
          throw invalidPhone;
        }
      }
    }),

  check('email')
    .trim()
    .custom(async (email) => {
      if (email && !validateEmail(email)) {
        throw 'Invalid email';
      }
    }),

  check('address').custom(async (address) => {
    if (address && address.zipCode && isNaN(address.zipCode)) {
      throw 'Zip code must be a numeric value';
    }
  }),

  check('nid').custom(async (nid) => {
    if (nid && isNaN(nid)) {
      throw 'NID code must be a numeric value';
    }
  }),
];




exports.updateMerchantValidator = [
  check('phone')
    .trim()
    .custom(async (phone) => {
      if (phone) {
        const invalidPhone = validatePhone(phone);
        if (invalidPhone) {
          throw invalidPhone;
        }
      }
    }),

  check('secondaryPhone')
    .trim()
    .custom(async (secondaryPhone) => {
      if (secondaryPhone) {
        const invalidPhone = validatePhone(secondaryPhone);
        if (invalidPhone) {
          throw invalidPhone;
        }
      }
    }),

  check('email')
    .trim()
    .custom(async (email) => {
      if (email && !validateEmail(email)) {
        throw 'Invalid email';
      }
    }),

  check('address').custom(async (address) => {
    if (address && address.zipCode && isNaN(address.zipCode)) {
      throw 'Zip code must be a numeric value';
    }
  }),

  check('nid').custom(async (nid) => {
    if (nid && isNaN(nid)) {
      throw 'NID code must be a numeric value';
    }
  }),
];



exports.idValidator = [
  param('id').custom(async (id) => {
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw 'No merchant data found by the id';
    }
  }),
];
