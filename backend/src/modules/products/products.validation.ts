import { z } from "zod";
import { ProductUnitType } from "@prisma/client";

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
});

export const createProductBodySchema = z.object({
  skuCode: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(140),
  category: z.string().trim().min(2).max(64),
  unitType: z.nativeEnum(ProductUnitType).default(ProductUnitType.Pouch),
  unitsPerCrate: z.coerce.number().int().min(1).max(1000).default(24),
  retailerPrice: z.union([z.string(), z.number()]),
  customerPrice: z.union([z.string(), z.number()]),
  gstPercentage: z.coerce.number().min(0).max(28).default(0),
  godownStockQty: z.coerce.number().int().min(0).default(0),
  isAvailable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === undefined ? true : v === true || v === "true")),
});

export const updateProductBodySchema = createProductBodySchema.partial();
