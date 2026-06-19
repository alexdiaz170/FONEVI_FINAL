import { Router } from 'express';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { createSocioController } from '../controllers/socioController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const socioRepo = new PrismaSocioRepository();
const socioController = createSocioController(socioRepo);

router.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.list.bind(socioController),
);
router.get(
  '/all',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.listAll.bind(socioController),
);
router.get('/:id', authenticate, socioController.get.bind(socioController));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.create.bind(socioController),
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.update.bind(socioController),
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.delete.bind(socioController),
);

export default router;
