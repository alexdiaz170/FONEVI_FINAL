import { Router } from 'express';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { PrismaCreditoRepository } from '../../infrastructure/persistence/PrismaCreditoRepository.js';
import { PrismaPagoCuotaRepository } from '../../infrastructure/persistence/PrismaPagoCuotaRepository.js';
import { createCreditoController } from '../controllers/creditoController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const socioRepo = new PrismaSocioRepository();
const creditoRepo = new PrismaCreditoRepository();
const pagoCuotaRepo = new PrismaPagoCuotaRepository();
const creditoController = createCreditoController(socioRepo, creditoRepo, pagoCuotaRepo);

router.get('/', authenticate, creditoController.list.bind(creditoController));
router.get('/resumen', authenticate, creditoController.resumen.bind(creditoController));
router.get('/calcular', authenticate, creditoController.calcular.bind(creditoController));
router.get('/:id', authenticate, creditoController.get.bind(creditoController));
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  creditoController.create.bind(creditoController),
);
router.post(
  '/:id/aprobar',
  authenticate,
  authorize('admin', 'superadmin'),
  creditoController.aprobar.bind(creditoController),
);
router.post(
  '/:id/rechazar',
  authenticate,
  authorize('admin', 'superadmin'),
  creditoController.rechazar.bind(creditoController),
);
router.post('/:id/pagar', authenticate, creditoController.pagarCuota.bind(creditoController));
router.delete(
  '/:id/pagos/:pagoId',
  authenticate,
  authorize('admin', 'superadmin'),
  creditoController.eliminarPagoCuota.bind(creditoController),
);

export default router;
