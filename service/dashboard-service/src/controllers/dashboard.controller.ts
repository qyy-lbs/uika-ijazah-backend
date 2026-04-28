import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getMainDashboard(req: AuthRequest, res: Response) {
    try {
      const result = await dashboardService.getMainDashboardStats();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}