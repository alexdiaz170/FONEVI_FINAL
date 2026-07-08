import { Router } from 'express';
import { PrismaUsuarioRepository } from '../../infrastructure/persistence/PrismaUsuarioRepository.js';
import { createUsuarioController, crearUsuarioSchema } from '../controllers/usuarioController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const usuarioRepo = new PrismaUsuarioRepository();
const controller = createUsuarioController(usuarioRepo);

router.get('/', authenticate, authorize('superadmin', 'admin'), controller.list.bind(controller));
router.post(
  '/',
  authenticate,
  authorize('superadmin', 'admin'),
  validate(crearUsuarioSchema),
  controller.create.bind(controller),
);
router.put(
  '/:id',
  authenticate,
  authorize('superadmin', 'admin'),
  controller.update.bind(controller),
);
router.delete('/:id', authenticate, authorize('superadmin'), controller.remove.bind(controller));

export default router;
