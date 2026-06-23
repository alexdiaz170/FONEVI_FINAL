import { Router } from 'express';
import { generarBackup } from '../controllers/backupController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/generar', authenticate, authorize('admin', 'superadmin'), generarBackup);

export default router;
