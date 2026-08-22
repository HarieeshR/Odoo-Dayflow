import { body, query } from 'express-validator';

export const checkInRules = [
  body('remarks').optional().isString().trim()
];

export const checkOutRules = [
  body('remarks').optional().isString().trim()
];

export const attendanceQueryRules = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid start date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid end date'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
  query('status').optional({ values: 'falsy' }).isIn(['present', 'absent', 'half_day', 'leave'])
];
