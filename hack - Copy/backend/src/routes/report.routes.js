import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

router.get('/attendance', authenticate, authorize('admin'), reportController.getAttendanceReport);
router.get('/leave', authenticate, authorize('admin'), reportController.getLeaveReport);
router.get('/payroll', authenticate, authorize('admin'), reportController.getPayrollReport);

export default router;
