import { Router } from 'express';
import { PrismaConfiguracionRepository } from '../../infrastructure/persistence/PrismaConfiguracionRepository.js';
import { createConfigController } from '../controllers/configController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const configRepo = new PrismaConfiguracionRepository();
const controller = createConfigController(configRepo);

router.get('/', authenticate, controller.list.bind(controller));
router.get('/:clave', authenticate, controller.get.bind(controller));
router.put(
  '/:clave',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.update.bind(controller),
);

export default router;
