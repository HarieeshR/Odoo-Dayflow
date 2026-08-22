import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { upload } from '../config/multer.js';
import { createLeaveRules, approveRejectRules, leaveQueryRules } from '../validators/leave.validator.js';
import * as leaveController from '../controllers/leave.controller.js';

const router = Router();

router.post('/', authenticate, authorize('employee'), upload.single('attachment'), createLeaveRules, validateRequest, leaveController.createRequest);
router.get('/me', authenticate, authorize('employee'), leaveQueryRules, validateRequest, leaveController.getMyRequests);
router.get('/balance/me', authenticate, authorize('employee'), leaveController.getMyBalance);
router.get('/', authenticate, authorize('admin'), leaveQueryRules, validateRequest, leaveController.getAllRequests);
router.patch('/:id/approve', authenticate, authorize('admin'), approveRejectRules, validateRequest, leaveController.approveRequest);
router.patch('/:id/reject', authenticate, authorize('admin'), approveRejectRules, validateRequest, leaveController.rejectRequest);
router.get('/balance', authenticate, authorize('admin'), leaveController.getAllBalances);
router.put('/balance/:employeeId', authenticate, authorize('admin'), leaveController.adjustBalance);

export default router;
