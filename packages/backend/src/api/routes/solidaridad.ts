import { Router } from 'express';
import { PrismaSolidaridadMovimientoRepository } from '../../infrastructure/persistence/PrismaSolidaridadMovimientoRepository.js';
import { createSolidaridadController } from '../controllers/solidaridadController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const repo = new PrismaSolidaridadMovimientoRepository();
const controller = createSolidaridadController(repo);

router.get('/', authenticate, controller.list.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.create.bind(controller),
);

export default router;
