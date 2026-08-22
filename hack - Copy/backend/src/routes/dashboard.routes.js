import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/admin', authenticate, authorize(ROLES.ADMIN), dashboardController.getAdminDashboard);
router.get('/employee', authenticate, dashboardController.getEmployeeDashboard);

export default router;
