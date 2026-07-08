import { Router } from 'express';
import { PrismaPeriodoRepository } from '../../infrastructure/persistence/PrismaPeriodoRepository.js';
import { createPeriodoController, crearPeriodoSchema } from '../controllers/periodoController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const periodoRepo = new PrismaPeriodoRepository();
const controller = createPeriodoController(periodoRepo);

router.get('/', authenticate, controller.list.bind(controller));
router.get('/activo', authenticate, controller.getActive.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(crearPeriodoSchema),
  controller.create.bind(controller),
);
router.post(
  '/:id/activar',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.activate.bind(controller),
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.eliminar.bind(controller),
);

export default router;
