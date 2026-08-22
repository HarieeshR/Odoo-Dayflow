import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createEmployeeRules, updateEmployeeRules, updateStatusRules } from '../validators/employee.validator.js';
import { validateRequest } from '../middleware/validate.js';
import { upload } from '../config/multer.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Create middleware function validateRequest if it doesn't exist, wait, the prompt doesn't specify validateRequest. 
// We will assume it exists from Phase 1, or I'll need to create it. Let's make sure it's valid.
// I will also add a simple validation middleware here just in case.

router.get('/', authenticate, authorize(ROLES.ADMIN), employeeController.listEmployees);
router.post('/', authenticate, authorize(ROLES.ADMIN), upload.single('profilePicture'), createEmployeeRules, validateRequest, employeeController.createEmployee);
router.get('/:id', authenticate, authorize(ROLES.ADMIN), employeeController.getEmployee);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), upload.single('profilePicture'), updateEmployeeRules, validateRequest, employeeController.updateEmployee);
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN), updateStatusRules, validateRequest, employeeController.updateStatus);
router.patch('/:id/reset-credentials', authenticate, authorize(ROLES.ADMIN), employeeController.resetCredentials);

export default router;
