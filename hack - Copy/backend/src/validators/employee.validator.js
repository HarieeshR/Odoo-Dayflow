import { body } from 'express-validator';

export const createEmployeeRules = [
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').optional({ values: 'falsy' }).trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('Invalid phone number'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('joiningDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid joining date'),
  body('location').optional({ values: 'falsy' }).trim(),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('manager').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid manager ID'),
  body('maritalStatus').optional({ values: 'falsy' }).isIn(['single', 'married', 'divorced', 'widowed']),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date of birth'),
  body('nationality').optional({ values: 'falsy' }).trim(),
  body('personalEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail().withMessage('Invalid personal email')
];

export const updateEmployeeRules = [
  body('firstName').optional({ values: 'falsy' }).notEmpty().withMessage('First name cannot be empty').trim(),
  body('lastName').optional({ values: 'falsy' }).trim(),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('Invalid phone number'),
  body('department').optional({ values: 'falsy' }).notEmpty().withMessage('Department cannot be empty'),
  body('designation').optional({ values: 'falsy' }).notEmpty().withMessage('Designation cannot be empty'),
  body('joiningDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid joining date'),
  body('location').optional({ values: 'falsy' }).trim(),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('manager').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid manager ID'),
  body('maritalStatus').optional({ values: 'falsy' }).isIn(['single', 'married', 'divorced', 'widowed']),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date of birth'),
  body('nationality').optional({ values: 'falsy' }).trim(),
  body('personalEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail().withMessage('Invalid personal email')
];

export const updateStatusRules = [
  body('status').isIn(['active', 'inactive', 'probation', 'terminated']).withMessage('Invalid status')
];
