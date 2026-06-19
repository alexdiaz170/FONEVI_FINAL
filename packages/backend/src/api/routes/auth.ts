import { Router } from 'express';
import { PrismaUsuarioRepository } from '../../infrastructure/persistence/PrismaUsuarioRepository.js';
import { createAuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const usuarioRepo = new PrismaUsuarioRepository();
const authController = createAuthController(usuarioRepo);

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.get('/profile', authenticate, authController.profile.bind(authController));

export default router;
