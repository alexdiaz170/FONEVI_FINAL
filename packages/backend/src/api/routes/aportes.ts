import { Router } from 'express';
import { PrismaAporteRepository } from '../../infrastructure/persistence/PrismaAporteRepository.js';
import { PrismaPeriodoRepository } from '../../infrastructure/persistence/PrismaPeriodoRepository.js';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { createAporteController } from '../controllers/aporteController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const aporteRepo = new PrismaAporteRepository();
const periodoRepo = new PrismaPeriodoRepository();
const socioRepo = new PrismaSocioRepository();
const aporteController = createAporteController(aporteRepo, periodoRepo, socioRepo);

router.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  aporteController.list.bind(aporteController),
);
router.get('/periodos', authenticate, aporteController.periodos.bind(aporteController));
router.get('/:id', authenticate, aporteController.get.bind(aporteController));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  aporteController.create.bind(aporteController),
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  aporteController.update.bind(aporteController),
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  aporteController.delete.bind(aporteController),
);

export default router;
