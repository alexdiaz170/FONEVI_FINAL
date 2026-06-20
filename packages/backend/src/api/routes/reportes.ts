import { Router } from 'express';
import { createReporteController } from '../controllers/reporteController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const controller = createReporteController();

router.get(
  '/balance-general',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.balanceGeneral.bind(controller),
);

router.get(
  '/cartera',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.cartera.bind(controller),
);

router.get(
  '/flujo-caja',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.flujoCaja.bind(controller),
);

router.get(
  '/estado-cuenta/:socioId',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.estadoCuentaSocio.bind(controller),
);

export default router;
