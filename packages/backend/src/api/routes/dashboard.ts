import { Router } from 'express';
import { PrismaDashboardRepository } from '../../infrastructure/persistence/PrismaDashboardRepository.js';
import { createDashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const dashboardRepo = new PrismaDashboardRepository();
const dashboardController = createDashboardController(dashboardRepo);

router.get('/resumen', authenticate, dashboardController.resumen.bind(dashboardController));
router.get('/balance', authenticate, dashboardController.balance.bind(dashboardController));

export default router;
