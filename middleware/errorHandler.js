class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  
  console.error('Error:', err);

  
  if (err.name === 'CastError') {
    const message = 'Невірний формат ID';
    error = new AppError(message, 400);
  }

  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} вже існує в системі`;
    error = new AppError(message, 400);
  }

  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.join(', ');
    error = new AppError(message, 400);
  }

  
  if (err.name === 'JsonWebTokenError') {
    const message = 'Невірний токен авторизації';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Термін дії токену закінчився. Будь ласка, увійдіть знову';
    error = new AppError(message, 401);
  }

  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Помилка сервера',
    
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { AppError, errorHandler };
