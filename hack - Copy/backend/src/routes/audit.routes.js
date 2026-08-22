import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as auditController from '../controllers/audit.controller.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), auditController.getAuditLogs);

export default router;
