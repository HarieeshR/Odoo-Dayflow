import { body } from 'express-validator';

export const signupRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'),
  body('role').optional().isIn(['employee', 'admin']).withMessage('Role must be employee or admin'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').optional().trim(),
  body('employeeId').optional().trim(),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('designation').optional().trim()
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must be at least 8 characters and contain at least 1 uppercase, 1 lowercase, and 1 number')
];

export const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

export const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must be at least 8 characters and contain at least 1 uppercase, 1 lowercase, and 1 number')
];
