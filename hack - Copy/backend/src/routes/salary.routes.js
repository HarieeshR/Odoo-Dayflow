import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { updateSalaryRules } from '../validators/salary.validator.js';
import * as salaryController from '../controllers/salary.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('employee'), salaryController.getMySalary);
router.get('/employees/:id', authenticate, authorize('admin'), salaryController.getEmployeeSalary);
router.put('/employees/:id', authenticate, authorize('admin'), updateSalaryRules, validateRequest, salaryController.updateSalary);
router.get('/history/:employeeId', authenticate, authorize('admin'), salaryController.getSalaryHistory);

export default router;
