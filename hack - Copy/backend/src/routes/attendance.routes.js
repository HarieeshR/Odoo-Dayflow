import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { checkInRules, checkOutRules, attendanceQueryRules } from '../validators/attendance.validator.js';
import * as attendanceController from '../controllers/attendance.controller.js';

const router = Router();

router.post('/check-in', authenticate, authorize('employee'), checkInRules, validateRequest, attendanceController.checkIn);
router.post('/check-out', authenticate, authorize('employee'), checkOutRules, validateRequest, attendanceController.checkOut);
router.get('/me', authenticate, authorize('employee'), attendanceQueryRules, validateRequest, attendanceController.getMyAttendance);
router.get('/', authenticate, authorize('admin'), attendanceQueryRules, validateRequest, attendanceController.getAllAttendance);
router.get('/reports', authenticate, authorize('admin'), attendanceController.getAttendanceReports);

export default router;
