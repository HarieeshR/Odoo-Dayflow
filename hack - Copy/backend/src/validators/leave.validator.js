import { body, query } from 'express-validator';
import { toUtcDateOnly } from '../utils/dates.js';

export const createLeaveRules = [
  body('leaveType').isMongoId().withMessage('Invalid leave type ID'),
  body('startDate').isISO8601().custom((value) => {
    const date = toUtcDateOnly(value);
    const today = toUtcDateOnly();
    if (date < today) {
      throw new Error('Start date must be today or in the future');
    }
    return true;
  }),
  body('endDate').isISO8601(),
  body('reason').notEmpty().trim().isLength({ max: 500 })
];

export const approveRejectRules = [
  body('comments').optional({ values: 'falsy' }).trim().isLength({ max: 500 })
];

export const leaveQueryRules = [
  query('status').optional({ values: 'falsy' }).isIn(['pending', 'approved', 'rejected']),
  query('startDate').optional({ values: 'falsy' }).isISO8601(),
  query('endDate').optional({ values: 'falsy' }).isISO8601(),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 })
];
