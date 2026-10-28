import { Router } from 'express';
import { Role } from '@prisma/client';
import { analyticsController } from './analytics.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { analyticsOverviewQuerySchema } from './analytics.validation';

const router = Router();

router.use(authenticate);

// GET /api/analytics/overview (Admin only)
router.get(
  '/overview',
  requireRoles(Role.ADMIN),
  validateRequest({ query: analyticsOverviewQuerySchema }),
  (req, res, next) => analyticsController.getOverview(req, res, next)
);

export default router;
