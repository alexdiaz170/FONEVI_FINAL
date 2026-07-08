import { Router } from 'express';
import { PrismaWaLogRepository } from '../../infrastructure/persistence/PrismaWaLogRepository.js';
import { createWhatsAppController } from '../controllers/whatsappController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { enviarWhatsAppSchema } from '../../application/dto/whatsapp.dto.js';
import { initQueue } from '../../infrastructure/queue/JobQueue.js';

const router = Router();
const waLogRepo = new PrismaWaLogRepository();

let controller: ReturnType<typeof createWhatsAppController> | null = null;

async function getController() {
  if (!controller) {
    const queue = await initQueue('whatsapp');
    controller = createWhatsAppController(waLogRepo, queue);
  }
  return controller;
}

router.get('/estado', authenticate, async (req, res, next) => {
  const c = await getController();
  c.estado(req, res, next);
});

router.get('/logs', authenticate, authorize('admin', 'superadmin'), async (req, res, next) => {
  const c = await getController();
  c.logs(req, res, next);
});

router.post(
  '/enviar',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(enviarWhatsAppSchema),
  async (req, res, next) => {
    const c = await getController();
    c.enviar(req, res, next);
  },
);

export default router;
