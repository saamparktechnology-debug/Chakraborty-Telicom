import { z } from "zod";
import {
  OrderStatus,
  LedgerEntryType,
  Role,
  StockMovementType,
} from "@prisma/client";
import { prisma } from "../../config/database";
import { Money } from "../../config/money";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/error.middleware";
import { AuthenticatedUser } from "../../middlewares/auth.middleware";
import {
  createIndentBodySchema,
  instantBillBodySchema,
  spotBillBodySchema,
  collectDueBodySchema,
} from "./retailer-orders.validation";

export class RetailerOrdersService {
  /**
   * Option B (Tax-Inclusive Single GST):
   * - If isGstBill = true and gstPct > 0:
   *   lineTotal = enteredAmount
   *   taxableAmount = round(lineTotal * 100 / (100 + gstPct))
   *   gstAmount = lineTotal - taxableAmount
   *   (So taxableAmount + gstAmount === lineTotal)
   * - If isGstBill = false:
   *   taxableAmount = lineTotal, gstAmount = 0
   */
  private computeInclusiveGstSplit(
    lineTotalPaise: bigint,
    isGstBill: boolean,
    gstPct: number,
  ) {
    if (!isGstBill || gstPct <= 0) {
      return {
        taxablePaise: lineTotalPaise,
        gstPaise: 0n,
      };
    }
    const rateBps = BigInt(Math.round(gstPct * 100)); // e.g. 5% -> 500
    const denom = 10000n + rateBps;
    const taxablePaise = (lineTotalPaise * 10000n + denom / 2n) / denom;
    const gstPaise = lineTotalPaise - taxablePaise;
    return { taxablePaise, gstPaise };
  }

  async listOrders(actor: AuthenticatedUser, status?: OrderStatus) {
    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }
    if (actor.role === Role.DSE) {
      whereClause.dseId = actor.id;
    } else if (actor.role === Role.RETAILER) {
      whereClause.retailerId = actor.id;
    }

    const orders = await prisma.retailerOrder.findMany({
      where: whereClause,
      include: {
        retailer: {
          select: { id: true, name: true, shopName: true, phone: true },
        },
        dse: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                skuCode: true,
                name: true,
                unitType: true,
                gstPercentage: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => ({
      id: o.id,
      invoiceNumber: o.invoiceNumber,
      retailerId: o.retailerId,
      retailerName: o.retailer.shopName || o.retailer.name,
      retailerShopName: o.retailer.shopName || o.retailer.name,
      dseId: o.dseId,
      dseName: o.dse ? o.dse.name : null,
      deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
      status: o.status,
      isGstBill: o.isGstBill,
      previousDueSnapshot: o.previousDueSnapshot.toString(),
      taxableSubtotal: o.taxableSubtotal.toString(),
      gstAmount: o.gstAmount.toString(),
      subtotal: o.subtotal.toString(),
      totalPayable: o.totalPayable.toString(),
      paidUpi: o.paidUpi.toString(),
      paidCash: o.paidCash.toString(),
      closingDue: o.closingDue.toString(),
      billedAt: o.billedAt ? o.billedAt.toISOString() : null,
      items: o.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        skuCode: item.product.skuCode,
        indentedQty: item.indentedQty,
        deliveredQty: item.deliveredQty,
        unitPrice: item.unitPrice.toString(),
        gstPercentage: Number(
          item.gstPercentage?.toString() ||
            item.product.gstPercentage?.toString() ||
            "0",
        ),
        taxableAmount: item.taxableAmount.toString(),
        gstAmount: item.gstAmount.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
    }));
  }

  async createIndent(
    actor: AuthenticatedUser,
    input: z.infer<typeof createIndentBodySchema>,
  ) {
    const retailer = await prisma.user.findUnique({
      where: { id: input.retailerId },
    });
    if (!retailer || retailer.role !== Role.RETAILER) {
      throw new AppError(404, "RETAILER_NOT_FOUND", "Retailer not found.");
    }
    if (
      actor.role === Role.DSE &&
      retailer.assignedDseId &&
      retailer.assignedDseId !== actor.id
    ) {
      throw new AppError(
        403,
        "FORBIDDEN_OWNERSHIP",
        "You can only take orders for your assigned retailers.",
      );
    }

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });
    if (products.length !== productIds.length) {
      throw new AppError(
        400,
        "UNAVAILABLE_PRODUCT",
        "One or more products are unavailable or invalid.",
      );
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    const invoiceNumber = `${env.INVOICE_NUMBER_PREFIX}${Date.now().toString().slice(-6)}`;

    return await prisma.$transaction(async (tx) => {
      const order = await tx.retailerOrder.create({
        data: {
          invoiceNumber,
          retailerId: retailer.id,
          dseId: actor.role === Role.DSE ? actor.id : retailer.assignedDseId,
          deliveryDate: new Date(`${input.deliveryDate}T00:00:00.000Z`),
          status: OrderStatus.INDENTED,
          items: {
            create: input.items.map((item) => {
              const prod = productMap.get(item.productId)!;
              return {
                productId: prod.id,
                indentedQty: item.indentedQty,
                deliveredQty: 0,
                unitPrice: prod.retailerPrice.toString(),
                gstPercentage: prod.gstPercentage.toString(),
                taxableAmount: "0.00",
                gstAmount: "0.00",
                lineTotal: "0.00",
              };
            }),
          },
        },
        include: {
          items: { include: { product: true } },
          retailer: true,
          dse: true,
        },
      });

      return order;
    });
  }

  async convertIndentToInstantBill(
    orderId: string,
    actor: AuthenticatedUser,
    input: z.infer<typeof instantBillBodySchema>,
  ) {
    const paidUpiPaise = Money.toPaise(input.paidUpi);
    const paidCashPaise = Money.toPaise(input.paidCash);
    if (paidUpiPaise < 0n || paidCashPaise < 0n) {
      throw new AppError(
        400,
        "INVALID_PAYMENT",
        "Paid UPI and Cash amounts cannot be negative.",
      );
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.retailerOrder.findUnique({
        where: { id: orderId },
        include: { items: true, retailer: true },
      });

      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order indent not found.");
      }
      if (order.status === OrderStatus.DELIVERED) {
        throw new AppError(
          409,
          "ALREADY_DELIVERED",
          "This indent has already been billed.",
        );
      }
      if (
        actor.role === Role.DSE &&
        order.retailer.assignedDseId &&
        order.retailer.assignedDseId !== actor.id
      ) {
        throw new AppError(
          403,
          "FORBIDDEN_OWNERSHIP",
          "DSE cannot bill another DSE's retailer.",
        );
      }

      // Determine whether stock deducts from DSE Vehicle Stock or Admin's Main Godown Stock:
      // - If the logged-in actor is a DSE, strictly use their own DSE ID (Vehicle Stock).
      // - If the logged-in actor is ADMIN:
      //   - For a Direct Retailer (order.retailer.assignedDseId === null), ALWAYS deduct from Main Godown Stock (responsibleDseId = null).
      //   - Even if an order was assigned to a DSE, if Admin is billing directly from the Hub Portal, deduct from Main Godown Stock unless the DSE vehicle actually holds enough allocated stock.
      const isDirectRetailer = !order.retailer.assignedDseId;
      const candidateDseId =
        actor.role === Role.DSE
          ? actor.id
          : isDirectRetailer
            ? null
            : order.dseId || order.retailer.assignedDseId || null;

      const balanceRecord = await tx.retailerBalance.findUnique({
        where: { retailerId: order.retailerId },
      });
      const previousDuePaise = Money.toPaise(
        balanceRecord ? balanceRecord.currentDue.toString() : "0.00",
      );

      const productIds = input.deliveredItems.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let billSubtotalPaise = 0n;
      let totalTaxablePaise = 0n;
      let totalGstPaise = 0n;

      for (const item of input.deliveredItems) {
        if (item.deliveredQty <= 0) continue;

        const product = productMap.get(item.productId);
        if (!product) {
          throw new AppError(
            404,
            "PRODUCT_NOT_FOUND",
            `Product ${item.productId} not found.`,
          );
        }

        // Check if DSE vehicle stock exists when candidateDseId is present
        let dseStock = candidateDseId
          ? await tx.dseStock.findUnique({
              where: {
                dseId_productId: {
                  dseId: candidateDseId,
                  productId: product.id,
                },
              },
            })
          : null;

        // STOCK DEDUCTION RULE:
        // 1. If actor is DSE: MUST deduct from DSE's Live Vehicle Stock (throw 400 INSUFFICIENT_VEHICLE_STOCK if not enough).
        // 2. If actor is ADMIN billing a Direct Retailer (or when DSE vehicle does not hold the stock): deduct from Admin's Main Godown Stock.
        const useVehicleStock =
          actor.role === Role.DSE ||
          (candidateDseId !== null &&
            dseStock !== null &&
            dseStock.liveQty >= item.deliveredQty);

        if (useVehicleStock && candidateDseId) {
          if (!dseStock || dseStock.liveQty < item.deliveredQty) {
            throw new AppError(
              400,
              "INSUFFICIENT_VEHICLE_STOCK",
              `400 Insufficient Vehicle Stock for ${product.name}: available ${dseStock?.liveQty || 0} units, trying to bill ${item.deliveredQty} units.`,
            );
          }

          const updatedDseStock = await tx.dseStock.update({
            where: { id: dseStock.id },
            data: { liveQty: { decrement: item.deliveredQty } },
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              dseId: candidateDseId,
              recordedById: actor.id,
              movementType: StockMovementType.RETAILER_SALE_DEDUCTION,
              quantity: item.deliveredQty,
              godownBalanceAfter: product.godownStockQty,
              dseBalanceAfter: updatedDseStock.liveQty,
              referenceId: order.invoiceNumber,
              notes: `Retailer delivery billed from DSE Vehicle (${order.invoiceNumber})`,
            },
          });
        } else {
          // Deduct from Admin's Main Godown Stock (auto-initialize godownStockQty if 0 on legacy seeded rows)
          const currentGodownQty = product.godownStockQty ?? 0;
          if (
            currentGodownQty < item.deliveredQty &&
            actor.role !== Role.ADMIN
          ) {
            throw new AppError(
              400,
              "INSUFFICIENT_GODOWN_STOCK",
              `400 Insufficient Main Godown Stock for ${product.name}: available ${currentGodownQty} units, trying to bill ${item.deliveredQty} units.`,
            );
          }

          const nextGodownQty = Math.max(
            0,
            currentGodownQty - item.deliveredQty,
          );
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: { godownStockQty: nextGodownQty },
          });
          product.godownStockQty = updatedProduct.godownStockQty;

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              recordedById: actor.id,
              movementType: StockMovementType.RETAILER_SALE_DEDUCTION,
              quantity: item.deliveredQty,
              godownBalanceAfter: updatedProduct.godownStockQty,
              referenceId: order.invoiceNumber,
              notes: `Direct / Hub Retailer delivery billed from Main Godown (${order.invoiceNumber})`,
            },
          });
        }

        const lineTotalPaise = Money.multiplyQty(
          product.retailerPrice.toString(),
          item.deliveredQty,
        );
        const gstPct = Number(product.gstPercentage.toString());
        const { taxablePaise, gstPaise } = this.computeInclusiveGstSplit(
          lineTotalPaise,
          Boolean(input.isGstBill),
          gstPct,
        );

        billSubtotalPaise += lineTotalPaise;
        totalTaxablePaise += taxablePaise;
        totalGstPaise += gstPaise;

        await tx.retailerOrderItem.updateMany({
          where: { orderId: order.id, productId: item.productId },
          data: {
            deliveredQty: item.deliveredQty,
            unitPrice: Money.toDecimalString(
              Money.toPaise(product.retailerPrice.toString()),
            ),
            gstPercentage: input.isGstBill ? gstPct.toFixed(2) : "0.00",
            taxableAmount: Money.toDecimalString(taxablePaise),
            gstAmount: Money.toDecimalString(gstPaise),
            lineTotal: Money.toDecimalString(lineTotalPaise),
          },
        });
      }

      const totalPayablePaise = previousDuePaise + billSubtotalPaise;
      const closingDuePaise =
        totalPayablePaise - (paidUpiPaise + paidCashPaise);

      const updatedOrder = await tx.retailerOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          dseId: candidateDseId,
          isGstBill: Boolean(input.isGstBill),
          previousDueSnapshot: Money.toDecimalString(previousDuePaise),
          taxableSubtotal: Money.toDecimalString(totalTaxablePaise),
          gstAmount: Money.toDecimalString(totalGstPaise),
          subtotal: Money.toDecimalString(billSubtotalPaise),
          totalPayable: Money.toDecimalString(totalPayablePaise),
          paidUpi: Money.toDecimalString(paidUpiPaise),
          paidCash: Money.toDecimalString(paidCashPaise),
          closingDue: Money.toDecimalString(closingDuePaise),
          billedAt: new Date(),
        },
        include: { items: { include: { product: true } } },
      });

      const billModeLabel = input.isGstBill
        ? `GST Invoice (Taxable ₹${Money.toDecimalString(totalTaxablePaise)} + GST ₹${Money.toDecimalString(totalGstPaise)})`
        : "Non-GST Bill of Supply";

      await tx.ledgerTransaction.create({
        data: {
          userId: order.retailerId,
          recordedById: actor.id,
          entryType: LedgerEntryType.INVOICE_DEBIT,
          amount: Money.toDecimalString(billSubtotalPaise),
          referenceId: order.invoiceNumber,
          notes: input.notes || `${billModeLabel} ${order.invoiceNumber}`,
        },
      });

      if (paidUpiPaise > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            userId: order.retailerId,
            recordedById: actor.id,
            entryType: LedgerEntryType.PAYMENT_UPI_CREDIT,
            amount: Money.toDecimalString(paidUpiPaise),
            referenceId: order.invoiceNumber,
            notes: `UPI split payment received for ${order.invoiceNumber}`,
          },
        });
      }

      if (paidCashPaise > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            userId: order.retailerId,
            recordedById: actor.id,
            entryType: LedgerEntryType.PAYMENT_CASH_CREDIT,
            amount: Money.toDecimalString(paidCashPaise),
            referenceId: order.invoiceNumber,
            notes: `Cash split payment received for ${order.invoiceNumber}`,
          },
        });
      }

      await tx.retailerBalance.upsert({
        where: { retailerId: order.retailerId },
        update: { currentDue: Money.toDecimalString(closingDuePaise) },
        create: {
          retailerId: order.retailerId,
          currentDue: Money.toDecimalString(closingDuePaise),
        },
      });

      return updatedOrder;
    });
  }

  async createSpotBill(
    actor: AuthenticatedUser,
    input: z.infer<typeof spotBillBodySchema>,
  ) {
    const indent = await this.createIndent(actor, {
      retailerId: input.retailerId,
      deliveryDate: new Date().toISOString().slice(0, 10),
      items: input.deliveredItems.map((i) => ({
        productId: i.productId,
        indentedQty: i.deliveredQty,
      })),
    });

    return await this.convertIndentToInstantBill(indent.id, actor, {
      isGstBill: input.isGstBill,
      deliveredItems: input.deliveredItems,
      paidUpi: input.paidUpi,
      paidCash: input.paidCash,
      notes: input.notes || "Spot bill delivery",
      idempotencyKey: input.idempotencyKey,
    });
  }

  async collectStandaloneDue(
    actor: AuthenticatedUser,
    input: z.infer<typeof collectDueBodySchema>,
  ) {
    const paidUpiPaise = Money.toPaise(input.paidUpi);
    const paidCashPaise = Money.toPaise(input.paidCash);
    if (paidUpiPaise <= 0n && paidCashPaise <= 0n) {
      throw new AppError(
        400,
        "INVALID_PAYMENT",
        "Enter a positive UPI or Cash amount.",
      );
    }

    return await prisma.$transaction(async (tx) => {
      const balanceRecord = await tx.retailerBalance.findUnique({
        where: { retailerId: input.retailerId },
      });
      const currentDuePaise = Money.toPaise(
        balanceRecord ? balanceRecord.currentDue.toString() : "0.00",
      );
      const closingDuePaise = currentDuePaise - (paidUpiPaise + paidCashPaise);
      const refId = `DUE-${Date.now().toString().slice(-6)}`;

      if (paidUpiPaise > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            userId: input.retailerId,
            recordedById: actor.id,
            entryType: LedgerEntryType.PAYMENT_UPI_CREDIT,
            amount: Money.toDecimalString(paidUpiPaise),
            referenceId: refId,
            notes: input.notes || `Standalone UPI due collection (${refId})`,
          },
        });
      }

      if (paidCashPaise > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            userId: input.retailerId,
            recordedById: actor.id,
            entryType: LedgerEntryType.PAYMENT_CASH_CREDIT,
            amount: Money.toDecimalString(paidCashPaise),
            referenceId: refId,
            notes: input.notes || `Standalone Cash due collection (${refId})`,
          },
        });
      }

      const updatedBalance = await tx.retailerBalance.upsert({
        where: { retailerId: input.retailerId },
        update: { currentDue: Money.toDecimalString(closingDuePaise) },
        create: {
          retailerId: input.retailerId,
          currentDue: Money.toDecimalString(closingDuePaise),
        },
      });

      return {
        retailerId: input.retailerId,
        previousDue: Money.toDecimalString(currentDuePaise),
        paidUpi: Money.toDecimalString(paidUpiPaise),
        paidCash: Money.toDecimalString(paidCashPaise),
        currentDue: updatedBalance.currentDue.toString(),
      };
    });
  }

  async getRetailerOrderHistoryAndPassbook(retailerId: string) {
    const [retailer, balance, orders, ledger] = await Promise.all([
      prisma.user.findUnique({
        where: { id: retailerId },
        select: {
          id: true,
          name: true,
          shopName: true,
          phone: true,
          address: true,
          assignedDseId: true,
        },
      }),
      prisma.retailerBalance.findUnique({ where: { retailerId } }),
      prisma.retailerOrder.findMany({
        where: { retailerId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ledgerTransaction.findMany({
        where: { userId: retailerId },
        include: {
          recordedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!retailer) {
      throw new AppError(404, "RETAILER_NOT_FOUND", "Retailer not found.");
    }

    return {
      retailer,
      currentDue: balance ? balance.currentDue.toString() : "0.00",
      orders: orders.map((o) => ({
        ...o,
        isGstBill: o.isGstBill,
        previousDueSnapshot: o.previousDueSnapshot.toString(),
        taxableSubtotal: o.taxableSubtotal.toString(),
        gstAmount: o.gstAmount.toString(),
        subtotal: o.subtotal.toString(),
        totalPayable: o.totalPayable.toString(),
        paidUpi: o.paidUpi.toString(),
        paidCash: o.paidCash.toString(),
        closingDue: o.closingDue.toString(),
      })),
      ledger: ledger.map((l) => ({
        id: l.id,
        entryType: l.entryType,
        amount: l.amount.toString(),
        referenceId: l.referenceId,
        notes: l.notes,
        createdAt: l.createdAt.toISOString(),
        recordedByName: l.recordedBy.name,
      })),
    };
  }
}

export const retailerOrdersService = new RetailerOrdersService();
