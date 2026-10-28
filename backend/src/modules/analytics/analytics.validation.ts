import { z } from 'zod';

export const analyticsOverviewQuerySchema = z.object({
  loadingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
