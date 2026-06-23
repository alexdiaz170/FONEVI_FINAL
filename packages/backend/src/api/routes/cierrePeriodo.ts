import { Router } from 'express';
import { createCierrePeriodoController } from '../controllers/cierrePeriodoController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const controller = createCierrePeriodoController();

router.post(
  '/validar',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.validar.bind(controller),
);
router.post(
  '/simular',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.simular.bind(controller),
);
router.post(
  '/ejecutar',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.ejecutar.bind(controller),
);

export default router;
