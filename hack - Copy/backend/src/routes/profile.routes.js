import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';
import { updateProfileRules } from '../validators/profile.validator.js';
import { validateRequest } from '../middleware/validate.js';
import { upload } from '../config/multer.js';

const router = Router();

router.get('/me', authenticate, profileController.getMyProfile);
router.put('/me', authenticate, upload.single('profilePicture'), updateProfileRules, validateRequest, profileController.updateMyProfile);

export default router;
