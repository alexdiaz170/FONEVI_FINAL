import { Router } from 'express';
import { PrismaNotificacionRepository } from '../../infrastructure/persistence/PrismaNotificacionRepository.js';
import { createNotificacionController } from '../controllers/notificacionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const notificacionRepo = new PrismaNotificacionRepository();
const controller = createNotificacionController(notificacionRepo);

router.get('/', authenticate, controller.list.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.create.bind(controller),
);
router.patch('/:id/leer', authenticate, controller.marcarLeida.bind(controller));

export default router;
