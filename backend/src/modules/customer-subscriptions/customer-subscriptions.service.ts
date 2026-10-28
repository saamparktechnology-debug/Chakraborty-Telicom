import { z } from "zod";
import {
  LedgerEntryType,
  Role,
  SubscriptionStatus,
  StockMovementType,
} from "@prisma/client";
import { prisma } from "../../config/database";
import { Money } from "../../config/money";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/error.middleware";
import { AuthenticatedUser } from "../../middlewares/auth.middleware";
import {
  walletTopupBodySchema,
  toggleSkipDayBodySchema,
  confirmDeliveryBodySchema,
  sendPeriodicBillBodySchema,
} from "./customer-subscriptions.validation";

export class CustomerSubscriptionsService {
  private computeInclusiveGstSplit(
    totalPaise: bigint,
    isGstBill: boolean,
    gstPct: number,
  ) {
    if (!isGstBill || gstPct <= 0) {
      return { taxablePaise: totalPaise, gstPaise: 0n };
    }
    const rateBps = BigInt(Math.round(gstPct * 100));
    const denom = 10000n + rateBps;
    const taxablePaise = (totalPaise * 10000n + denom / 2n) / denom;
    const gstPaise = totalPaise - taxablePaise;
    return { taxablePaise, gstPaise };
  }

  async topUpWallet(
    customerId: string,
    actor: AuthenticatedUser,
    input: z.infer<typeof walletTopupBodySchema>,
  ) {
    const topupPaise = Money.toPaise(input.amount);
    if (topupPaise <= 0n) {
      throw new AppError(
        400,
        "INVALID_AMOUNT",
        "Top-up amount must be greater than zero.",
      );
    }

    return await prisma.$transaction(async (tx) => {
      const current = await tx.customerWallet.findUnique({
        where: { customerId },
      });
      const currentPaise = Money.toPaise(
        current ? current.walletBalance.toString() : "0.00",
      );
      const nextPaise = currentPaise + topupPaise;

      const updated = await tx.customerWallet.upsert({
        where: { customerId },
        update: { walletBalance: Money.toDecimalString(nextPaise) },
        create: { customerId, walletBalance: Money.toDecimalString(nextPaise) },
      });

      await tx.ledgerTransaction.create({
        data: {
          userId: customerId,
          recordedById: actor.id,
          entryType: LedgerEntryType.WALLET_TOPUP_CREDIT,
          amount: Money.toDecimalString(topupPaise),
          referenceId: `TOPUP-${Date.now().toString().slice(-6)}`,
          notes: input.notes || "Prepaid wallet recharge by Admin",
        },
      });

      return {
        customerId,
        walletBalance: updated.walletBalance.toString(),
      };
    });
  }

  async getCustomerDashboard(customerId: string) {
    const [
      customer,
      wallet,
      subscriptions,
      skipDays,
      deliveries,
      bills,
      ledger,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          assignedDseId: true,
        },
      }),
      prisma.customerWallet.findUnique({ where: { customerId } }),
      prisma.customerSubscription.findMany({
        where: { customerId },
        include: { product: true },
      }),
      prisma.customerSkipDay.findMany({
        where: { customerId },
        orderBy: { skipDate: "asc" },
      }),
      prisma.customerDailyDelivery.findMany({
        where: { customerId },
        include: { product: true },
        orderBy: { deliveryDate: "desc" },
        take: 30,
      }),
      prisma.customerMonthlyBill.findMany({
        where: { customerId },
        orderBy: { sentAt: "desc" },
      }),
      prisma.ledgerTransaction.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    if (!customer) {
      throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
    }

    return {
      customer,
      walletBalance: wallet ? wallet.walletBalance.toString() : "0.00",
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        productId: s.productId,
        productName: s.product.name,
        customerPrice: s.product.customerPrice.toString(),
        gstPercentage: Number(s.product.gstPercentage.toString()),
        dailyQty: s.dailyQty,
        status: s.status,
      })),
      skipDays: skipDays.map((sk) => ({
        id: sk.id,
        skipDate: sk.skipDate.toISOString().slice(0, 10),
        reason: sk.reason,
      })),
      deliveries: deliveries.map((d) => ({
        id: d.id,
        deliveryDate: d.deliveryDate.toISOString().slice(0, 10),
        productName: d.product.name,
        deliveredQty: d.deliveredQty,
        isGstBill: d.isGstBill,
        gstPercentage: Number(d.gstPercentage.toString()),
        taxableAmount: d.taxableAmount.toString(),
        gstAmount: d.gstAmount.toString(),
        deductedAmount: d.deductedAmount.toString(),
        walletBalanceAfter: d.walletBalanceAfter.toString(),
      })),
      bills: bills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        periodStart: b.periodStart.toISOString().slice(0, 10),
        periodEnd: b.periodEnd.toISOString().slice(0, 10),
        isGstBill: b.isGstBill,
        taxableAmount: b.taxableAmount.toString(),
        gstAmount: b.gstAmount.toString(),
        deliveriesAmount: b.deliveriesAmount.toString(),
        topupsAmount: b.topupsAmount.toString(),
        closingBalance: b.closingBalance.toString(),
        sentAt: b.sentAt.toISOString(),
      })),
      ledger: ledger.map((l) => ({
        id: l.id,
        entryType: l.entryType,
        amount: l.amount.toString(),
        referenceId: l.referenceId,
        notes: l.notes,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  async toggleSkipDay(
    actor: AuthenticatedUser,
    input: z.infer<typeof toggleSkipDayBodySchema>,
  ) {
    const targetCustomerId =
      actor.role === Role.CUSTOMER ? actor.id : input.customerId || actor.id;
    const skipDateObj = new Date(`${input.skipDate}T00:00:00.000Z`);

    const existing = await prisma.customerSkipDay.findUnique({
      where: {
        customerId_skipDate: {
          customerId: targetCustomerId,
          skipDate: skipDateObj,
        },
      },
    });

    if (existing) {
      await prisma.customerSkipDay.delete({ where: { id: existing.id } });
      return { skipped: false, skipDate: input.skipDate };
    } else {
      await prisma.customerSkipDay.create({
        data: {
          customerId: targetCustomerId,
          skipDate: skipDateObj,
          reason: input.reason || "Customer marked Skip in app",
        },
      });
      return { skipped: true, skipDate: input.skipDate };
    }
  }

  async confirmDailyDelivery(
    actor: AuthenticatedUser,
    input: z.infer<typeof confirmDeliveryBodySchema>,
  ) {
    const dateStr = input.deliveryDate || new Date().toISOString().slice(0, 10);
    const deliveryDateObj = new Date(`${dateStr}T00:00:00.000Z`);

    return await prisma.$transaction(async (tx) => {
      const customer = await tx.user.findUnique({
        where: { id: input.customerId },
      });
      if (!customer || customer.role !== Role.CUSTOMER) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
      }

      const skipEntry = await tx.customerSkipDay.findUnique({
        where: {
          customerId_skipDate: {
            customerId: input.customerId,
            skipDate: deliveryDateObj,
          },
        },
      });
      if (skipEntry) {
        throw new AppError(
          400,
          "DATE_SKIPPED",
          `Customer marked ${dateStr} as "Skip — Not Needed". Delivery blocked.`,
        );
      }

      const activeSub = await tx.customerSubscription.findFirst({
        where: {
          customerId: input.customerId,
          status: SubscriptionStatus.ACTIVE,
        },
        include: { product: true },
      });

      if (!activeSub) {
        throw new AppError(
          400,
          "NO_ACTIVE_SUBSCRIPTION",
          "Customer has no active subscription.",
        );
      }

      const qtyToDeliver = input.deliveredQty ?? activeSub.dailyQty;
      const product = activeSub.product;

      // Vehicle Stock vs Main Godown Stock Resolution:
      // - If actor is DSE: strictly require and deduct from DSE's Live Vehicle Stock (400 INSUFFICIENT_VEHICLE_STOCK if insufficient).
      // - If actor is ADMIN (or Direct Customer with no DSE / DSE vehicle has 0 stock when Admin confirms from Web Portal): deduct from Main Godown Stock.
      const candidateDseId =
        actor.role === Role.DSE ? actor.id : customer.assignedDseId || null;

      const dseStock = candidateDseId
        ? await tx.dseStock.findUnique({
            where: {
              dseId_productId: { dseId: candidateDseId, productId: product.id },
            },
          })
        : null;

      const useVehicleStock =
        actor.role === Role.DSE ||
        (candidateDseId !== null &&
          dseStock !== null &&
          dseStock.liveQty >= qtyToDeliver);

      if (useVehicleStock && candidateDseId) {
        if (!dseStock || dseStock.liveQty < qtyToDeliver) {
          throw new AppError(
            400,
            "INSUFFICIENT_VEHICLE_STOCK",
            `400 Insufficient Vehicle Stock for ${product.name}: available ${dseStock?.liveQty || 0} units, required ${qtyToDeliver} units.`,
          );
        }

        const updatedDseStock = await tx.dseStock.update({
          where: { id: dseStock.id },
          data: { liveQty: { decrement: qtyToDeliver } },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            dseId: candidateDseId,
            recordedById: actor.id,
            movementType: StockMovementType.CUSTOMER_DROP_DEDUCTION,
            quantity: qtyToDeliver,
            godownBalanceAfter: product.godownStockQty,
            dseBalanceAfter: updatedDseStock.liveQty,
            referenceId: `DROP-${dateStr}`,
            notes: `Daily milk drop to ${customer.name} (from DSE Vehicle)`,
          },
        });
      } else {
        const currentGodownQty = product.godownStockQty ?? 0;
        if (currentGodownQty < qtyToDeliver && actor.role !== Role.ADMIN) {
          throw new AppError(
            400,
            "INSUFFICIENT_GODOWN_STOCK",
            `400 Insufficient Main Godown Stock for ${product.name}: available ${currentGodownQty} units.`,
          );
        }

        const nextGodownQty = Math.max(0, currentGodownQty - qtyToDeliver);
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { godownStockQty: nextGodownQty },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            recordedById: actor.id,
            movementType: StockMovementType.CUSTOMER_DROP_DEDUCTION,
            quantity: qtyToDeliver,
            godownBalanceAfter: updatedProduct.godownStockQty,
            referenceId: `DROP-${dateStr}`,
            notes: `Direct / Hub milk drop to ${customer.name} (from Main Godown)`,
          },
        });
      }

      const deductionPaise = Money.multiplyQty(
        product.customerPrice.toString(),
        qtyToDeliver,
      );
      const gstPct = Number(product.gstPercentage.toString());
      const { taxablePaise, gstPaise } = this.computeInclusiveGstSplit(
        deductionPaise,
        Boolean(input.isGstBill),
        gstPct,
      );

      const wallet = await tx.customerWallet.findUnique({
        where: { customerId: input.customerId },
      });
      const currentPaise = Money.toPaise(
        wallet ? wallet.walletBalance.toString() : "0.00",
      );
      const afterPaise = currentPaise - deductionPaise;

      if (env.NEGATIVE_WALLET_POLICY === "BLOCK" && afterPaise < 0n) {
        throw new AppError(
          400,
          "INSUFFICIENT_WALLET_BALANCE",
          `Insufficient customer wallet balance (₹${Money.toDecimalString(currentPaise)}) for ₹${Money.toDecimalString(deductionPaise)} deduction.`,
        );
      }

      const updatedWallet = await tx.customerWallet.upsert({
        where: { customerId: input.customerId },
        update: { walletBalance: Money.toDecimalString(afterPaise) },
        create: {
          customerId: input.customerId,
          walletBalance: Money.toDecimalString(afterPaise),
        },
      });

      const delivery = await tx.customerDailyDelivery.create({
        data: {
          customerId: input.customerId,
          dseId: candidateDseId,
          deliveryDate: deliveryDateObj,
          productId: product.id,
          deliveredQty: qtyToDeliver,
          isGstBill: Boolean(input.isGstBill),
          gstPercentage: input.isGstBill ? gstPct.toFixed(2) : "0.00",
          taxableAmount: Money.toDecimalString(taxablePaise),
          gstAmount: Money.toDecimalString(gstPaise),
          deductedAmount: Money.toDecimalString(deductionPaise),
          walletBalanceAfter: updatedWallet.walletBalance.toString(),
        },
      });

      const gstNote = input.isGstBill
        ? ` [GST ${gstPct}%: Taxable ₹${Money.toDecimalString(taxablePaise)} + GST ₹${Money.toDecimalString(gstPaise)}]`
        : " [Non-GST]";

      await tx.ledgerTransaction.create({
        data: {
          userId: input.customerId,
          recordedById: actor.id,
          entryType: LedgerEntryType.DAILY_DELIVERY_DEBIT,
          amount: Money.toDecimalString(deductionPaise),
          referenceId: delivery.id,
          notes: `Daily milk drop: ${qtyToDeliver} × ${product.name}${gstNote}`,
        },
      });

      return {
        deliveryId: delivery.id,
        deductedAmount: Money.toDecimalString(deductionPaise),
        taxableAmount: Money.toDecimalString(taxablePaise),
        gstAmount: Money.toDecimalString(gstPaise),
        walletBalanceAfter: updatedWallet.walletBalance.toString(),
      };
    });
  }

  async sendPeriodicBill(
    customerId: string,
    _actor: AuthenticatedUser,
    input: z.infer<typeof sendPeriodicBillBodySchema>,
  ) {
    const startObj = new Date(`${input.periodStart}T00:00:00.000Z`);
    const endObj = new Date(`${input.periodEnd}T23:59:59.999Z`);

    const [deliveries, topups, wallet] = await Promise.all([
      prisma.customerDailyDelivery.findMany({
        where: {
          customerId,
          deliveryDate: { gte: startObj, lte: endObj },
        },
        include: { product: true },
      }),
      prisma.ledgerTransaction.findMany({
        where: {
          userId: customerId,
          entryType: LedgerEntryType.WALLET_TOPUP_CREDIT,
          createdAt: { gte: startObj, lte: endObj },
        },
      }),
      prisma.customerWallet.findUnique({ where: { customerId } }),
    ]);

    let deliveriesPaise = 0n;
    let taxablePaise = 0n;
    let gstPaise = 0n;

    for (const d of deliveries) {
      const amtPaise = Money.toPaise(d.deductedAmount.toString());
      deliveriesPaise += amtPaise;
      const pct = Number(d.product.gstPercentage.toString());
      const split = this.computeInclusiveGstSplit(
        amtPaise,
        Boolean(input.isGstBill || d.isGstBill),
        pct,
      );
      taxablePaise += split.taxablePaise;
      gstPaise += split.gstPaise;
    }

    let topupsPaise = 0n;
    for (const t of topups) {
      topupsPaise += Money.toPaise(t.amount.toString());
    }

    const billNumber = `BILL-2026-${Date.now().toString().slice(-5)}`;
    const bill = await prisma.customerMonthlyBill.create({
      data: {
        billNumber,
        customerId,
        periodStart: startObj,
        periodEnd: endObj,
        isGstBill: Boolean(input.isGstBill),
        taxableAmount: Money.toDecimalString(taxablePaise),
        gstAmount: Money.toDecimalString(gstPaise),
        deliveriesAmount: Money.toDecimalString(deliveriesPaise),
        topupsAmount: Money.toDecimalString(topupsPaise),
        closingBalance: wallet ? wallet.walletBalance.toString() : "0.00",
      },
    });

    return {
      ...bill,
      taxableAmount: bill.taxableAmount.toString(),
      gstAmount: bill.gstAmount.toString(),
      deliveriesAmount: bill.deliveriesAmount.toString(),
      topupsAmount: bill.topupsAmount.toString(),
      closingBalance: bill.closingBalance.toString(),
    };
  }
}

export const customerSubscriptionsService = new CustomerSubscriptionsService();
