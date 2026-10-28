import { z } from "zod";

const stockItemLineSchema = z.object({
  productId: z.string().uuid(),
  cratesQty: z.coerce.number().int().min(0).default(0),
  looseQty: z.coerce.number().int().min(0).default(0),
  totalUnits: z.coerce.number().int().min(0).optional(),
});

export const amulInwardStockBodySchema = z.object({
  items: z.array(stockItemLineSchema).min(1),
  referenceId: z.string().max(80).optional(),
  notes: z.string().max(300).optional(),
});

export const allocateToDseBodySchema = z.object({
  dseId: z.string().uuid(),
  items: z.array(stockItemLineSchema).min(1),
  notes: z.string().max(300).optional(),
});

export const returnFromDseBodySchema = z.object({
  dseId: z.string().uuid(),
  returnAllRemaining: z.boolean().default(false),
  items: z.array(stockItemLineSchema).optional(),
  notes: z.string().max(300).optional(),
});
