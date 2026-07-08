import { Router } from 'express';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { PrismaAporteRepository } from '../../infrastructure/persistence/PrismaAporteRepository.js';
import { PrismaUsuarioRepository } from '../../infrastructure/persistence/PrismaUsuarioRepository.js';
import { createSocioController } from '../controllers/socioController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { crearSocioSchema, actualizarSocioSchema } from '../../application/dto/socio.dto.js';

const router = Router();
const socioRepo = new PrismaSocioRepository();
const aporteRepo = new PrismaAporteRepository();
const usuarioRepo = new PrismaUsuarioRepository();
const socioController = createSocioController(socioRepo, aporteRepo, usuarioRepo);

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
  validate(crearSocioSchema),
  socioController.create.bind(socioController),
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(actualizarSocioSchema),
  socioController.update.bind(socioController),
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  socioController.delete.bind(socioController),
);

export default router;
