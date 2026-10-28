import { z } from 'zod';
import { Role } from '@prisma/client';

export const onboardUserBodySchema = z.object({
  role: z.nativeEnum(Role),
  name: z.string().trim().min(2).max(120),
  shopName: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(6).default('Amul@2026!'),
  assignedDseId: z.string().uuid().optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  initialSubscription: z
    .object({
      productId: z.string().uuid(),
      dailyQty: z.number().int().positive().max(100),
    })
    .optional(),
});

export const listRetailersQuerySchema = z.object({
  directOnly: z.enum(['true', 'false']).optional(),
});

export type OnboardUserInput = z.infer<typeof onboardUserBodySchema>;
