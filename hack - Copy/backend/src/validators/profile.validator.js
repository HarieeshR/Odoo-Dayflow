import { body } from 'express-validator';

const optionalText = (field) => body(field).optional({ values: 'falsy' }).trim();

export const updateProfileRules = [
  body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('Invalid phone number'),
  body('personalEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail().withMessage('Invalid personal email'),
  optionalText('nationality'),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('maritalStatus').optional({ values: 'falsy' }).isIn(['single', 'married', 'divorced', 'widowed']).withMessage('Invalid marital status'),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date of birth'),
  body('aboutMe').optional({ values: 'falsy' }).isLength({ max: 2000 }).withMessage('About me must be 2000 characters or less'),
  optionalText('bankName'),
  optionalText('accountNumber'),
  optionalText('ifsc'),
  optionalText('pan'),
  optionalText('uan')
];
