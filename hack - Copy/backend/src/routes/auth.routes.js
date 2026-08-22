import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { upload } from '../config/multer.js';
import { 
  signupRules,
  loginRules, 
  changePasswordRules, 
  forgotPasswordRules, 
  resetPasswordRules 
} from '../validators/auth.validator.js';

const router = express.Router();

router.post('/signup', upload.single('profilePicture'), signupRules, validateRequest, authController.signup);
router.post('/login', loginRules, validateRequest, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, changePasswordRules, validateRequest, authController.changePassword);
router.post('/forgot-password', forgotPasswordRules, validateRequest, authController.forgotPassword);
router.post('/reset-password', resetPasswordRules, validateRequest, authController.resetPassword);

export default router;
