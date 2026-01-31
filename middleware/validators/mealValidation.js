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

const createMealValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Назва прийому їжі обов\'язкова')
    .isLength({ min: 2, max: 100 }).withMessage('Назва має бути від 2 до 100 символів'),

  body('mealType')
    .notEmpty().withMessage('Тип прийому їжі обов\'язковий')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Невірний тип прийому їжі'),

  body('date')
    .optional()
    .isISO8601().withMessage('Невірний формат дати')
    .toDate(),

  body('items')
    .isArray({ min: 1 }).withMessage('Прийом їжі має містити хоча б один продукт')
    .custom((items) => {
      if (items.length > 50) {
        throw new Error('Максимум 50 продуктів на прийом їжі');
      }
      return true;
    }),

  body('items.*.product')
    .notEmpty().withMessage('ID продукту обов\'язковий')
    .isMongoId().withMessage('Невірний ID продукту'),

  body('items.*.amount')
    .notEmpty().withMessage('Кількість обов\'язкова')
    .isFloat({ min: 1, max: 10000 }).withMessage('Кількість має бути від 1 до 10000 грамів')
    .toFloat(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Примітки мають бути максимум 500 символів'),

  handleValidationErrors
];

const updateMealValidation = [
  param('id')
    .isMongoId().withMessage('Невірний ID прийому їжі'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Назва має бути від 2 до 100 символів'),

  body('mealType')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Невірний тип прийому їжі'),

  body('date')
    .optional()
    .isISO8601().withMessage('Невірний формат дати')
    .toDate(),

  body('items')
    .optional()
    .isArray({ min: 1 }).withMessage('Прийом їжі має містити хоча б один продукт')
    .custom((items) => {
      if (items && items.length > 50) {
        throw new Error('Максимум 50 продуктів на прийом їжі');
      }
      return true;
    }),

  body('items.*.product')
    .optional()
    .isMongoId().withMessage('Невірний ID продукту'),

  body('items.*.amount')
    .optional()
    .isFloat({ min: 1, max: 10000 }).withMessage('Кількість має бути від 1 до 10000 грамів')
    .toFloat(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Примітки мають бути максимум 500 символів'),

  handleValidationErrors
];

const getMealsValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Невірна початкова дата')
    .toDate(),

  query('endDate')
    .optional()
    .isISO8601().withMessage('Невірна кінцева дата')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('Кінцева дата має бути після початкової');
      }
      return true;
    }),

  query('mealType')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Невірний тип прийому їжі'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Сторінка має бути позитивним числом')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Ліміт має бути від 1 до 100')
    .toInt(),

  handleValidationErrors
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Невірний ID'),
  handleValidationErrors
];

module.exports = {
  createMealValidation,
  updateMealValidation,
  getMealsValidation,
  mongoIdValidation
};
