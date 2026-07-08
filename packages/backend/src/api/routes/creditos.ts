import { Router } from 'express';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { PrismaCreditoRepository } from '../../infrastructure/persistence/PrismaCreditoRepository.js';
import { PrismaPagoCuotaRepository } from '../../infrastructure/persistence/PrismaPagoCuotaRepository.js';
import { createCreditoController } from '../controllers/creditoController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  solicitarCreditoSchema,
  pagarCuotaSchema,
} from '../../application/use-cases/creditos/creditoSchemas.js';

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
  validate(solicitarCreditoSchema),
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
router.get(
  '/capacidad/:socioId',
  authenticate,
  creditoController.calcularCapacidad.bind(creditoController),
);
router.get(
  '/:id/amortizacion',
  authenticate,
  creditoController.getAmortizacion.bind(creditoController),
);
router.get('/:id/pagos', authenticate, creditoController.getPagos.bind(creditoController));
router.post(
  '/:id/pagar',
  authenticate,
  validate(pagarCuotaSchema),
  creditoController.pagarCuota.bind(creditoController),
);
router.delete(
  '/:id/pagos/:pagoId',
  authenticate,
  authorize('admin', 'superadmin'),
  creditoController.eliminarPagoCuota.bind(creditoController),
);

export default router;
