import { Router } from 'express';
import { PrismaAcuerdoPagoRepository } from '../../infrastructure/persistence/PrismaAcuerdoPagoRepository.js';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { createMoraController } from '../controllers/moraController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const acuerdoRepo = new PrismaAcuerdoPagoRepository();
const socioRepo = new PrismaSocioRepository();
const controller = createMoraController(acuerdoRepo, socioRepo);

router.get('/', authenticate, controller.calcular.bind(controller));
router.get('/acuerdos', authenticate, controller.listarAcuerdos.bind(controller));
router.post(
  '/acuerdos',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.crearAcuerdo.bind(controller),
);

export default router;
