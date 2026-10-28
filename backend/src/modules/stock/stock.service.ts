import { z } from "zod";
import { Role, StockMovementType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import { AuthenticatedUser } from "../../middlewares/auth.middleware";
import {
  amulInwardStockBodySchema,
  allocateToDseBodySchema,
  returnFromDseBodySchema,
} from "./stock.validation";

export class StockService {
  private computeTotalUnits(
    line: { cratesQty?: number; looseQty?: number; totalUnits?: number },
    unitsPerCrate: number,
  ): number {
    if (line.totalUnits !== undefined && line.totalUnits > 0) {
      return line.totalUnits;
    }
    return (
      Number(line.cratesQty || 0) * unitsPerCrate + Number(line.looseQty || 0)
    );
  }

  async getStockOverview(actor: AuthenticatedUser) {
    const [products, dses, dseStocks, recentMovements] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { role: Role.DSE, isActive: true },
        select: { id: true, name: true, phone: true, address: true },
      }),
      prisma.dseStock.findMany({
        where: actor.role === Role.DSE ? { dseId: actor.id } : {},
        include: {
          product: true,
          dse: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.stockMovement.findMany({
        where: actor.role === Role.DSE ? { dseId: actor.id } : {},
        include: {
          product: {
            select: {
              id: true,
              skuCode: true,
              name: true,
              unitType: true,
              unitsPerCrate: true,
            },
          },
          dse: { select: { id: true, name: true, phone: true } },
          recordedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    const godownStock = products.map((p) => ({
      productId: p.id,
      skuCode: p.skuCode,
      name: p.name,
      category: p.category,
      unitType: p.unitType,
      unitsPerCrate: p.unitsPerCrate,
      godownStockQty: p.godownStockQty,
      crates: Math.floor(p.godownStockQty / p.unitsPerCrate),
      loose: p.godownStockQty % p.unitsPerCrate,
    }));

    const dseLiveInventory = dses
      .filter((d) => (actor.role === Role.DSE ? d.id === actor.id : true))
      .map((dse) => {
        const items = products.map((prod) => {
          const row = dseStocks.find(
            (s) => s.dseId === dse.id && s.productId === prod.id,
          );
          const liveQty = row ? row.liveQty : 0;
          return {
            productId: prod.id,
            skuCode: prod.skuCode,
            productName: prod.name,
            unitType: prod.unitType,
            unitsPerCrate: prod.unitsPerCrate,
            liveQty,
            crates: Math.floor(liveQty / prod.unitsPerCrate),
            loose: liveQty % prod.unitsPerCrate,
          };
        });
        return {
          dseId: dse.id,
          dseName: dse.name,
          dsePhone: dse.phone,
          beat: dse.address,
          items,
        };
      });

    return {
      godownStock,
      dseLiveInventory,
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        movementType: m.movementType,
        productId: m.productId,
        skuCode: m.product.skuCode,
        productName: m.product.name,
        dseId: m.dseId,
        dseName: m.dse?.name || null,
        quantity: m.quantity,
        godownBalanceAfter: m.godownBalanceAfter,
        dseBalanceAfter: m.dseBalanceAfter,
        referenceId: m.referenceId,
        notes: m.notes,
        recordedByName: m.recordedBy.name,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * 1. Admin receives stock from AMUL Dairy into Main Godown
   */
  async addAmulInwardStock(
    actor: AuthenticatedUser,
    input: z.infer<typeof amulInwardStockBodySchema>,
  ) {
    return await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new AppError(
            404,
            "PRODUCT_NOT_FOUND",
            `Product ${item.productId} not found.`,
          );
        }

        const addUnits = this.computeTotalUnits(item, product.unitsPerCrate);
        if (addUnits <= 0) continue;

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { godownStockQty: { increment: addUnits } },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            recordedById: actor.id,
            movementType: StockMovementType.AMUL_INWARD,
            quantity: addUnits,
            godownBalanceAfter: updatedProduct.godownStockQty,
            referenceId:
              input.referenceId || `INWARD-${Date.now().toString().slice(-6)}`,
            notes:
              input.notes ||
              `Received ${addUnits} units from Amul Dairy into Godown`,
          },
        });

        results.push({
          productId: product.id,
          name: product.name,
          addedQty: addUnits,
          godownStockQty: updatedProduct.godownStockQty,
        });
      }

      if (results.length === 0) {
        throw new AppError(
          400,
          "EMPTY_STOCK_INWARD",
          "Enter quantity > 0 for at least one product.",
        );
      }

      return results;
    });
  }

  /**
   * 2. Admin allocates stock from Godown to DSE Vehicle
   */
  async allocateStockToDse(
    actor: AuthenticatedUser,
    input: z.infer<typeof allocateToDseBodySchema>,
  ) {
    const dse = await prisma.user.findUnique({ where: { id: input.dseId } });
    if (!dse || dse.role !== Role.DSE) {
      throw new AppError(404, "DSE_NOT_FOUND", "Target DSE account not found.");
    }

    return await prisma.$transaction(async (tx) => {
      const allocated = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new AppError(
            404,
            "PRODUCT_NOT_FOUND",
            `Product ${item.productId} not found.`,
          );
        }

        const assignUnits = this.computeTotalUnits(item, product.unitsPerCrate);
        if (assignUnits <= 0) continue;

        if (product.godownStockQty < assignUnits) {
          throw new AppError(
            400,
            "INSUFFICIENT_GODOWN_STOCK",
            `Insufficient Godown stock for ${product.name}: available ${product.godownStockQty}, requested ${assignUnits}.`,
          );
        }

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { godownStockQty: { decrement: assignUnits } },
        });

        const updatedDseStock = await tx.dseStock.upsert({
          where: { dseId_productId: { dseId: dse.id, productId: product.id } },
          update: { liveQty: { increment: assignUnits } },
          create: {
            dseId: dse.id,
            productId: product.id,
            liveQty: assignUnits,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            dseId: dse.id,
            recordedById: actor.id,
            movementType: StockMovementType.DSE_ALLOCATION,
            quantity: assignUnits,
            godownBalanceAfter: updatedProduct.godownStockQty,
            dseBalanceAfter: updatedDseStock.liveQty,
            referenceId: `ALLOC-${Date.now().toString().slice(-6)}`,
            notes:
              input.notes || `Allocated ${assignUnits} units to ${dse.name}`,
          },
        });

        allocated.push({
          productId: product.id,
          name: product.name,
          allocatedQty: assignUnits,
          godownStockQty: updatedProduct.godownStockQty,
          dseLiveQty: updatedDseStock.liveQty,
        });
      }

      if (allocated.length === 0) {
        throw new AppError(
          400,
          "EMPTY_ALLOCATION",
          "Enter quantity > 0 for at least one product.",
        );
      }

      return allocated;
    });
  }

  /**
   * 3. End-of-Day Return from DSE back to Admin's Main Godown Stock
   */
  async returnStockFromDse(
    actor: AuthenticatedUser,
    input: z.infer<typeof returnFromDseBodySchema>,
  ) {
    const dse = await prisma.user.findUnique({ where: { id: input.dseId } });
    if (!dse || dse.role !== Role.DSE) {
      throw new AppError(404, "DSE_NOT_FOUND", "Target DSE account not found.");
    }

    return await prisma.$transaction(async (tx) => {
      const returned = [];

      if (input.returnAllRemaining) {
        const activeStocks = await tx.dseStock.findMany({
          where: { dseId: dse.id, liveQty: { gt: 0 } },
          include: { product: true },
        });

        for (const st of activeStocks) {
          const returnQty = st.liveQty;
          const updatedProduct = await tx.product.update({
            where: { id: st.productId },
            data: { godownStockQty: { increment: returnQty } },
          });

          const updatedDseStock = await tx.dseStock.update({
            where: { id: st.id },
            data: { liveQty: 0 },
          });

          await tx.stockMovement.create({
            data: {
              productId: st.productId,
              dseId: dse.id,
              recordedById: actor.id,
              movementType: StockMovementType.DSE_RETURN,
              quantity: returnQty,
              godownBalanceAfter: updatedProduct.godownStockQty,
              dseBalanceAfter: updatedDseStock.liveQty,
              referenceId: `RET-${Date.now().toString().slice(-6)}`,
              notes:
                input.notes ||
                `End-of-day full unsold stock return from ${dse.name}`,
            },
          });

          returned.push({
            productId: st.productId,
            name: st.product.name,
            returnedQty: returnQty,
            godownStockQty: updatedProduct.godownStockQty,
            dseLiveQty: 0,
          });
        }
      } else {
        for (const item of input.items || []) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) continue;

          const returnUnits = this.computeTotalUnits(
            item,
            product.unitsPerCrate,
          );
          if (returnUnits <= 0) continue;

          const dseStock = await tx.dseStock.findUnique({
            where: {
              dseId_productId: { dseId: dse.id, productId: product.id },
            },
          });

          if (!dseStock || dseStock.liveQty < returnUnits) {
            throw new AppError(
              400,
              "INVALID_RETURN_QTY",
              `${dse.name} only has ${dseStock?.liveQty || 0} units of ${product.name} on vehicle (cannot return ${returnUnits}).`,
            );
          }

          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: { godownStockQty: { increment: returnUnits } },
          });

          const updatedDseStock = await tx.dseStock.update({
            where: { id: dseStock.id },
            data: { liveQty: { decrement: returnUnits } },
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              dseId: dse.id,
              recordedById: actor.id,
              movementType: StockMovementType.DSE_RETURN,
              quantity: returnUnits,
              godownBalanceAfter: updatedProduct.godownStockQty,
              dseBalanceAfter: updatedDseStock.liveQty,
              referenceId: `RET-${Date.now().toString().slice(-6)}`,
              notes: input.notes || `End-of-day return from ${dse.name}`,
            },
          });

          returned.push({
            productId: product.id,
            name: product.name,
            returnedQty: returnUnits,
            godownStockQty: updatedProduct.godownStockQty,
            dseLiveQty: updatedDseStock.liveQty,
          });
        }
      }

      if (returned.length === 0) {
        throw new AppError(
          400,
          "NO_STOCK_TO_RETURN",
          "No remaining vehicle stock found to return.",
        );
      }

      return returned;
    });
  }
}

export const stockService = new StockService();
