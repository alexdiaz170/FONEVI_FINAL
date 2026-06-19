import { Router } from 'express';
import { createAuditoriaController } from '../controllers/auditoriaController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const controller = createAuditoriaController();

router.get('/', authenticate, authorize('admin', 'superadmin'), controller.list.bind(controller));

export default router;
