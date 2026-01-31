const { body, query, validationResult } = require('express-validator');

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

const updateDailyLogValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Дата має бути в форматі ISO8601'),

  body('waterIntake')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Споживання води має бути від 0 до 10000 мл'),

  body('weight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Вага має бути від 20 до 500 кг'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Нотатки не можуть перевищувати 500 символів'),

  handleValidationErrors
];

const getDailyLogValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Дата має бути в форматі ISO8601'),

  handleValidationErrors
];

const getWeeklyStatsValidation = [
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Кінцева дата має бути в форматі ISO8601'),

  handleValidationErrors
];

const getMonthlyStatsValidation = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Рік має бути від 2000 до 2100'),

  query('month')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Місяць має бути від 0 до 11'),

  handleValidationErrors
];

const getProgressChartValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Кількість днів має бути від 1 до 365'),

  handleValidationErrors
];

const getMealsByCategoryValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Кількість днів має бути від 1 до 365'),

  handleValidationErrors
];

module.exports = {
  updateDailyLogValidation,
  getDailyLogValidation,
  getWeeklyStatsValidation,
  getMonthlyStatsValidation,
  getProgressChartValidation,
  getMealsByCategoryValidation
};
