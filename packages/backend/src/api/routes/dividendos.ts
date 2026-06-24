import { Router } from 'express';
import { PrismaDividendoRepository } from '../../infrastructure/persistence/PrismaDividendoRepository.js';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { createDividendoController } from '../controllers/dividendoController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const dividendoRepo = new PrismaDividendoRepository();
const socioRepo = new PrismaSocioRepository();
const controller = createDividendoController(dividendoRepo, socioRepo);

router.get('/', authenticate, controller.list.bind(controller));
router.get('/:id', authenticate, controller.getById.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.create.bind(controller),
);
router.post(
  '/:id/distribuir',
  authenticate,
  authorize('admin', 'superadmin'),
  controller.distribuir.bind(controller),
);

export default router;
