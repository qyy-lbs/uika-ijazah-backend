import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.use(authMiddleware);
router.get('/main', dashboardController.getMainDashboard.bind(dashboardController));

export default router;