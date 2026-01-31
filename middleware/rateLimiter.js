const rateLimit = require('express-rate-limit');


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // 100 запитів на вікно
  message: {
    success: false,
    message: 'Забагато запитів з цієї IP адреси, спробуйте пізніше'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 5, // 5 спроб за 15 хвилин
  skipSuccessfulRequests: true, 
  message: {
    success: false,
    message: 'Забагато спроб авторизації, спробуйте через 15 хвилин'
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 20, // 20 AI запитів на годину
  message: {
    success: false,
    message: 'Ліміт AI запитів вичерпано, спробуйте через годину'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter
};
