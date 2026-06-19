import { Router } from 'express';
import { createDashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const dashboardController = createDashboardController();

router.get('/resumen', authenticate, dashboardController.resumen.bind(dashboardController));
router.get('/balance', authenticate, dashboardController.balance.bind(dashboardController));

export default router;
