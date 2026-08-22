import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ');
    return errorResponse(res, messages, 'VALIDATION_ERROR', 400);
  }
  next();
};
