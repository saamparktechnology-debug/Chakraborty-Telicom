import { z } from "zod";

export const walletTopupBodySchema = z.object({
  amount: z.union([z.string(), z.number()]),
  notes: z.string().max(300).optional(),
});

export const toggleSkipDayBodySchema = z.object({
  customerId: z.string().uuid().optional(),
  skipDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  reason: z.string().max(255).optional(),
});

export const confirmDeliveryBodySchema = z.object({
  customerId: z.string().uuid(),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  deliveredQty: z.coerce.number().int().positive().optional(),
  isGstBill: z.boolean().default(false),
});

export const sendPeriodicBillBodySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isGstBill: z.boolean().default(false),
});
