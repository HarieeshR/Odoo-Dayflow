import { body } from 'express-validator';

export const updateSalaryRules = [
  body('monthlyWage').isFloat({ min: 0 }).withMessage('Monthly wage must be a positive number'),
  body('components').isArray().withMessage('Components must be an array'),
  body('components.*.name').notEmpty().withMessage('Component name is required'),
  body('components.*.type').isIn(['fixed', 'percentage']).withMessage('Invalid component type'),
  body('components.*.value').isFloat({ min: 0 }).withMessage('Component value must be a positive number'),
  body('deductions').isArray().withMessage('Deductions must be an array'),
  body('deductions.*.name').notEmpty().withMessage('Deduction name is required'),
  body('deductions.*.type').isIn(['fixed', 'percentage']).withMessage('Invalid deduction type'),
  body('deductions.*.value').isFloat({ min: 0 }).withMessage('Deduction value must be a positive number'),
  body('effectiveDate').isISO8601().withMessage('Effective date is required and must be a valid date'),
  body('changeReason').optional().trim()
];
