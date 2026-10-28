import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loadingDate = req.query.loadingDate as string | undefined;
      const data = await analyticsService.getOverview(loadingDate);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
