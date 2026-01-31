const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Помилка валідації',
      errors: errors.array()
    });
  }
  next();
};

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Назва продукту обов\'язкова')
    .isLength({ min: 2, max: 100 }).withMessage('Назва має бути від 2 до 100 символів'),

  body('category')
    .optional()
    .isIn(['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'legumes', 'nuts', 'sweets', 'beverages', 'other'])
    .withMessage('Невірна категорія'),

  body('nutritionPer100g.calories')
    .notEmpty().withMessage('Калорії обов\'язкові')
    .isFloat({ min: 0, max: 900 }).withMessage('Калорії мають бути від 0 до 900 ккал')
    .toFloat(),

  body('nutritionPer100g.protein')
    .notEmpty().withMessage('Білки обов\'язкові')
    .isFloat({ min: 0, max: 100 }).withMessage('Білки мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.fats')
    .notEmpty().withMessage('Жири обов\'язкові')
    .isFloat({ min: 0, max: 100 }).withMessage('Жири мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.carbs')
    .notEmpty().withMessage('Вуглеводи обов\'язкові')
    .isFloat({ min: 0, max: 100 }).withMessage('Вуглеводи мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.fiber')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Клітковина має бути від 0 до 100 г')
    .toFloat(),

  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic має бути boolean'),

  handleValidationErrors
];

const updateProductValidation = [
  param('id')
    .isMongoId().withMessage('Невірний ID продукту'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Назва має бути від 2 до 100 символів'),

  body('category')
    .optional()
    .isIn(['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'legumes', 'nuts', 'sweets', 'beverages', 'other'])
    .withMessage('Невірна категорія'),

  body('nutritionPer100g.calories')
    .optional()
    .isFloat({ min: 0, max: 900 }).withMessage('Калорії мають бути від 0 до 900 ккал')
    .toFloat(),

  body('nutritionPer100g.protein')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Білки мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.fats')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Жири мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.carbs')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Вуглеводи мають бути від 0 до 100 г')
    .toFloat(),

  body('nutritionPer100g.fiber')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Клітковина має бути від 0 до 100 г')
    .toFloat(),

  handleValidationErrors
];

const getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Сторінка має бути позитивним числом')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Ліміт має бути від 1 до 100')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Пошуковий запит занадто довгий'),

  query('category')
    .optional()
    .isIn(['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'legumes', 'nuts', 'sweets', 'beverages', 'other'])
    .withMessage('Невірна категорія'),

  handleValidationErrors
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Невірний ID'),
  handleValidationErrors
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  mongoIdValidation
};
