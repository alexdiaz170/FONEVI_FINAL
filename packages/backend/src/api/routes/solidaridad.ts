import { Router } from 'express';
import { PrismaSolidaridadMovimientoRepository } from '../../infrastructure/persistence/PrismaSolidaridadMovimientoRepository.js';
import { PrismaMovimientoRepository } from '../../infrastructure/persistence/PrismaMovimientoRepository.js';
import { createSolidaridadController } from '../controllers/solidaridadController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registrarSolidaridadSchema } from '../../application/dto/notificacion-solidaridad.dto.js';

const router = Router();
const solidaridadRepo = new PrismaSolidaridadMovimientoRepository();
const movimientoRepo = new PrismaMovimientoRepository();
const controller = createSolidaridadController(solidaridadRepo, movimientoRepo);

router.get('/', authenticate, controller.list.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(registrarSolidaridadSchema),
  controller.create.bind(controller),
);

export default router;
