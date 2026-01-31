const { body, validationResult } = require('express-validator');

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

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ім\'я обов\'язкове')
    .isLength({ min: 2, max: 50 }).withMessage('Ім\'я має бути від 2 до 50 символів'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email обов\'язковий')
    .isEmail().withMessage('Введіть правильний email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Пароль обов\'язковий')
    .isLength({ min: 6 }).withMessage('Пароль має бути мінімум 6 символів')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Пароль має містити великі, малі літери та цифру'),

  body('profile.age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Вік має бути від 13 до 120 років'),

  body('profile.weight')
    .optional()
    .isFloat({ min: 20, max: 500 }).withMessage('Вага має бути від 20 до 500 кг'),

  body('profile.height')
    .optional()
    .isInt({ min: 50, max: 300 }).withMessage('Зріст має бути від 50 до 300 см'),

  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Невірне значення статі'),

  body('profile.activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .withMessage('Невірне значення рівня активності'),

  body('profile.goal')
    .optional()
    .isIn(['lose_weight', 'maintain', 'gain_weight', 'gain_muscle'])
    .withMessage('Невірне значення цілі'),

  handleValidationErrors
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email обов\'язковий')
    .isEmail().withMessage('Введіть правильний email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Пароль обов\'язковий'),

  handleValidationErrors
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Ім\'я має бути від 2 до 50 символів'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Введіть правильний email')
    .normalizeEmail(),

  body('profile.age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Вік має бути від 13 до 120 років'),

  body('profile.weight')
    .optional()
    .isFloat({ min: 20, max: 500 }).withMessage('Вага має бути від 20 до 500 кг'),

  body('profile.height')
    .optional()
    .isInt({ min: 50, max: 300 }).withMessage('Зріст має бути від 50 до 300 см'),

  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Невірне значення статі'),

  body('profile.activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .withMessage('Невірне значення рівня активності'),

  body('profile.goal')
    .optional()
    .isIn(['lose_weight', 'maintain', 'gain_weight', 'gain_muscle'])
    .withMessage('Невірне значення цілі'),

  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation
};
