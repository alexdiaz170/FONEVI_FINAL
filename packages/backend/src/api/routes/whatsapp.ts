import { Router } from 'express';
import { PrismaWaLogRepository } from '../../infrastructure/persistence/PrismaWaLogRepository.js';
import { createWhatsAppController } from '../controllers/whatsappController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const waLogRepo = new PrismaWaLogRepository();
const controller = createWhatsAppController(waLogRepo);

router.get('/estado', authenticate, controller.estado.bind(controller));
router.get(
  '/logs',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.logs.bind(controller),
);
router.post(
  '/enviar',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.enviar.bind(controller),
);

export default router;
