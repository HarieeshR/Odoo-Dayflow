import { errorResponse } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errors.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  let statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errorCode = ERROR_CODES.INTERNAL_ERROR;
  
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  }
  
  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  }
  
  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for ${field}. Please use another value.`;
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = ERROR_CODES.INVALID_TOKEN;
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
  }
  
  if (err.name === 'MulterError' || err.message?.includes('Invalid file type') || err.message?.includes('File too large')) {
    statusCode = 400;
    message = err.message;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  }

  if (err.customErrorCode) {
    errorCode = err.customErrorCode;
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode
    }
  });
};
