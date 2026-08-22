import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/index.js';
import { errorResponse } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return errorResponse(res, 'Not authorized to access this route', ERROR_CODES.AUTH_FAILED, 401);
    }
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId).populate('employee');
      
      if (!user) {
        return errorResponse(res, 'User no longer exists', ERROR_CODES.NOT_FOUND, 401);
      }
      
      if (!user.isActive) {
        return errorResponse(res, 'Account is inactive', ERROR_CODES.INACTIVE_ACCOUNT, 401);
      }
      
      req.user = user;
      next();
    } catch (error) {
      return errorResponse(res, 'Not authorized to access this route', ERROR_CODES.INVALID_TOKEN, 401);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden', ERROR_CODES.FORBIDDEN, 403);
    }
    next();
  };
};

export const requireOwnership = (paramName) => {
  return (req, res, next) => {
    const resourceId = req.params[paramName];
    const isOwner = req.user.employee && req.user.employee._id.toString() === resourceId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Forbidden', ERROR_CODES.FORBIDDEN, 403);
    }
    
    next();
  };
};
