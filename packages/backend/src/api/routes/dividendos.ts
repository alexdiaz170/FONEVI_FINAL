import { Router } from 'express';
import { PrismaDividendoRepository } from '../../infrastructure/persistence/PrismaDividendoRepository.js';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { createDividendoController } from '../controllers/dividendoController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  crearDividendoSchema,
  distribuirDividendoSchema,
} from '../../application/dto/sprint6.dto.js';

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
  validate(crearDividendoSchema),
  controller.create.bind(controller),
);
router.post(
  '/:id/distribuir',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(distribuirDividendoSchema),
  controller.distribuir.bind(controller),
);

export default router;
