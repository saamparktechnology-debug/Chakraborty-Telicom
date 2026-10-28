import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});

export const createIndentBodySchema = z.object({
  retailerId: z.string().uuid(),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        indentedQty: z.number().int().positive().max(10000),
      }),
    )
    .min(1),
});

export const instantBillBodySchema = z.object({
  isGstBill: z.boolean().default(false),
  deliveredItems: z
    .array(
      z.object({
        productId: z.string().uuid(),
        deliveredQty: z.number().int().min(0).max(10000),
      }),
    )
    .min(1),
  paidUpi: z.union([z.string(), z.number()]).default("0.00"),
  paidCash: z.union([z.string(), z.number()]).default("0.00"),
  notes: z.string().max(300).optional(),
  idempotencyKey: z.string().max(80).optional(),
});

export const spotBillBodySchema = z.object({
  retailerId: z.string().uuid(),
  isGstBill: z.boolean().default(false),
  deliveredItems: z
    .array(
      z.object({
        productId: z.string().uuid(),
        deliveredQty: z.number().int().positive().max(10000),
      }),
    )
    .min(1),
  paidUpi: z.union([z.string(), z.number()]).default("0.00"),
  paidCash: z.union([z.string(), z.number()]).default("0.00"),
  notes: z.string().max(300).optional(),
  idempotencyKey: z.string().max(80).optional(),
});

export const collectDueBodySchema = z.object({
  retailerId: z.string().uuid(),
  paidUpi: z.union([z.string(), z.number()]).default("0.00"),
  paidCash: z.union([z.string(), z.number()]).default("0.00"),
  notes: z.string().max(300).optional(),
});
