import { Router } from 'express';
import { PrismaUsuarioRepository } from '../../infrastructure/persistence/PrismaUsuarioRepository.js';
import { PrismaSocioRepository } from '../../infrastructure/persistence/PrismaSocioRepository.js';
import { PrismaCreditoRepository } from '../../infrastructure/persistence/PrismaCreditoRepository.js';
import { PrismaAporteRepository } from '../../infrastructure/persistence/PrismaAporteRepository.js';
import { createAuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse } from '../response.js';
import { ObtenerMiDashboardUseCase } from '../../application/use-cases/auth/ObtenerMiDashboardUseCase.js';
import { ConfiguracionService } from '../../application/services/ConfiguracionService.js';
import { Password } from '../../domain/value-objects/Password.js';
import { cambiarPasswordSchema } from '../../application/dto/auth.dto.js';
import { ValidationError } from '../../application/errors.js';

const router = Router();
const usuarioRepo = new PrismaUsuarioRepository();
const authController = createAuthController(usuarioRepo);

const miDashboardUseCase = new ObtenerMiDashboardUseCase(
  new PrismaSocioRepository(),
  new PrismaCreditoRepository(),
  new PrismaAporteRepository(),
  new ConfiguracionService(),
);

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.get('/profile', authenticate, authController.profile.bind(authController));

router.get('/mi-dashboard', authenticate, async (req, res, next) => {
  try {
    const result = await miDashboardUseCase.execute(req.usuario!.email);
    apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const parsed = cambiarPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
    }
    const { currentPassword, newPassword } = parsed.data;
    const valid = await usuarioRepo.verifyPassword(req.usuario!.id, currentPassword);
    if (!valid) throw new ValidationError('La contraseña actual no es correcta');
    const newPwd = Password.fromPlain(newPassword);
    await usuarioRepo.updatePassword(req.usuario!.id, newPwd);
    apiResponse.success(res, { message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
