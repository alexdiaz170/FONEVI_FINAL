import { Router } from 'express';
import { PrismaMovimientoRepository } from '../../infrastructure/persistence/PrismaMovimientoRepository.js';
import { createMovimientoController } from '../controllers/movimientoController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registrarMovimientoSchema } from '../../application/dto/movimiento.dto.js';

const router = Router();
const movimientoRepo = new PrismaMovimientoRepository();
const movimientoController = createMovimientoController(movimientoRepo);

router.get('/', authenticate, movimientoController.list.bind(movimientoController));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(registrarMovimientoSchema),
  movimientoController.create.bind(movimientoController),
);

export default router;
