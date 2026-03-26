const mongoose = require('mongoose')
const { check , param } = require('express-validator')

exports.addCategoryValidator = [
    check('name').trim().notEmpty().withMessage('Name is required'),
]

exports.idValidator = [
    param('id').custom(async (id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw 'No merchant data found by the id';
      }
    }),
];