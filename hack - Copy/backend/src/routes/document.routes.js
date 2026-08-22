import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import * as documentController from '../controllers/document.controller.js';

const router = Router();

router.post('/', authenticate, upload.single('file'), documentController.uploadDocument);
router.get('/me', authenticate, documentController.getMyDocuments);
router.get('/', authenticate, authorize('admin'), documentController.getAllDocuments);
router.get('/:id/download', authenticate, documentController.downloadDocument);
router.delete('/:id', authenticate, documentController.deleteDocument);

export default router;
