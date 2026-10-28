import {
  Role,
  OrderStatus,
  SubscriptionStatus,
  LedgerEntryType,
} from "@prisma/client";
import { prisma } from "../../config/database";
import { Money } from "../../config/money";
import { usersService } from "../users/users.service";
import { env } from "../../config/env";

export class AnalyticsService {
  async getExecutiveOverview(targetDateStr?: string) {
    const targetDate = targetDateStr || new Date().toISOString().slice(0, 10);
    const targetDateObj = new Date(`${targetDate}T00:00:00.000Z`);

    const [
      products,
      users,
      retailerBalances,
      customerWallets,
      orders,
      subscriptions,
      skipDays,
      ledgerEntries,
    ] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({ where: { isActive: true } }),
      prisma.retailerBalance.findMany(),
      prisma.customerWallet.findMany(),
      prisma.retailerOrder.findMany({
        include: {
          items: { include: { product: true } },
          retailer: {
            select: { id: true, name: true, shopName: true, phone: true },
          },
          dse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customerSubscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        include: { product: true },
      }),
      prisma.customerSkipDay.findMany({
        where: { skipDate: targetDateObj },
      }),
      prisma.ledgerTransaction.findMany({
        include: {
          user: {
            select: { id: true, name: true, shopName: true, role: true },
          },
          recordedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    let todayRevenuePaise = 0n;
    let todayCashPaise = 0n;
    let todayUpiPaise = 0n;

    for (const ord of orders) {
      if (ord.status === OrderStatus.DELIVERED) {
        todayRevenuePaise += Money.toPaise(ord.subtotal.toString());
      }
    }

    for (const led of ledgerEntries) {
      if (led.entryType === LedgerEntryType.PAYMENT_CASH_CREDIT) {
        todayCashPaise += Money.toPaise(led.amount.toString());
      } else if (led.entryType === LedgerEntryType.PAYMENT_UPI_CREDIT) {
        todayUpiPaise += Money.toPaise(led.amount.toString());
      }
    }

    let marketReceivablesPaise = 0n;
    const balanceMap = new Map<string, string>();
    for (const rb of retailerBalances) {
      const val = rb.currentDue.toString();
      balanceMap.set(rb.retailerId, val);
      marketReceivablesPaise += Money.toPaise(val);
    }

    let walletLiabilityPaise = 0n;
    let lowWalletCount = 0;
    const lowThresholdPaise = Money.toPaise("150.00");
    for (const cw of customerWallets) {
      const p = Money.toPaise(cw.walletBalance.toString());
      walletLiabilityPaise += p;
      if (p < lowThresholdPaise) {
        lowWalletCount++;
      }
    }

    let activeDailyUnits = 0;
    for (const sub of subscriptions) {
      activeDailyUnits += sub.dailyQty;
    }

    // DSE Reconciliation
    const dses = users.filter((u) => u.role === Role.DSE);
    const dsePerformance = dses.map((dse) => {
      let cashPaise = 0n;
      let upiPaise = 0n;
      let billedPaise = 0n;

      for (const led of ledgerEntries) {
        if (led.recordedById === dse.id) {
          if (led.entryType === LedgerEntryType.PAYMENT_CASH_CREDIT) {
            cashPaise += Money.toPaise(led.amount.toString());
          } else if (led.entryType === LedgerEntryType.PAYMENT_UPI_CREDIT) {
            upiPaise += Money.toPaise(led.amount.toString());
          } else if (led.entryType === LedgerEntryType.INVOICE_DEBIT) {
            billedPaise += Money.toPaise(led.amount.toString());
          }
        }
      }

      const assignedRetailers = users.filter(
        (u) => u.role === Role.RETAILER && u.assignedDseId === dse.id,
      ).length;
      const assignedCustomers = users.filter(
        (u) => u.role === Role.CUSTOMER && u.assignedDseId === dse.id,
      ).length;
      const pendingIndents = orders.filter(
        (o) => o.dseId === dse.id && o.status === OrderStatus.INDENTED,
      ).length;

      return {
        dseId: dse.id,
        dseName: dse.name,
        dsePhone: dse.phone,
        beat: dse.address || "Assigned Beat",
        cashCollected: Money.toDecimalString(cashPaise),
        upiCollected: Money.toDecimalString(upiPaise),
        totalBilled: Money.toDecimalString(billedPaise),
        assignedRetailers,
        assignedCustomers,
        pendingIndents,
      };
    });

    // Overdue Retailers Table
    const retailers = users.filter((u) => u.role === Role.RETAILER);
    const overdueRetailers = retailers
      .map((r) => {
        const dse = r.assignedDseId
          ? users.find((u) => u.id === r.assignedDseId)
          : null;
        const currentDue = balanceMap.get(r.id) || "0.00";
        return {
          retailerId: r.id,
          shopName: r.shopName || r.name,
          ownerName: r.name,
          phone: r.phone,
          assignedDseName: dse ? dse.name : null,
          currentDue,
        };
      })
      .sort((a, b) => Number(b.currentDue) - Number(a.currentDue));

    // Next-Day Morning Vehicle Loading Sheet WITH 4-Side Product Pictures & Stock
    const skippedCustomerIds = new Set(skipDays.map((s) => s.customerId));
    const loadingSheet = products.map((prod) => {
      let indentedQty = 0;
      for (const ord of orders) {
        if (
          ord.status === OrderStatus.INDENTED ||
          ord.status === OrderStatus.OUT_FOR_DELIVERY
        ) {
          for (const item of ord.items) {
            if (item.productId === prod.id) {
              indentedQty += item.indentedQty;
            }
          }
        }
      }

      let activeSubQty = 0;
      let skippedQty = 0;
      for (const sub of subscriptions) {
        if (sub.productId === prod.id) {
          activeSubQty += sub.dailyQty;
          if (skippedCustomerIds.has(sub.customerId)) {
            skippedQty += sub.dailyQty;
          }
        }
      }

      const totalUnitsNeeded = Math.max(
        0,
        indentedQty + activeSubQty - skippedQty,
      );
      const crates = Math.floor(
        totalUnitsNeeded / Math.max(1, prod.unitsPerCrate),
      );
      const loose = totalUnitsNeeded % Math.max(1, prod.unitsPerCrate);

      const primaryImage =
        prod.imageFrontUrl ||
        prod.imageUrl ||
        prod.imageBackUrl ||
        prod.imageLeftUrl ||
        prod.imageRightUrl ||
        null;

      return {
        productId: prod.id,
        skuCode: prod.skuCode,
        productName: prod.name,
        category: prod.category,
        unitType: prod.unitType,
        unitsPerCrate: prod.unitsPerCrate,
        retailerPrice: prod.retailerPrice.toString(),
        customerPrice: prod.customerPrice.toString(),
        gstPercentage: prod.gstPercentage
          ? Number(prod.gstPercentage.toString())
          : 0,
        godownStockQty: prod.godownStockQty ?? 0,
        imageUrl: primaryImage,
        imageFrontUrl: prod.imageFrontUrl || null,
        imageBackUrl: prod.imageBackUrl || null,
        imageLeftUrl: prod.imageLeftUrl || null,
        imageRightUrl: prod.imageRightUrl || null,
        indentedQty,
        activeSubQty,
        skippedQty,
        totalUnitsNeeded,
        crates,
        loose,
      };
    });

    return {
      kpis: {
        todayRevenue: Money.toDecimalString(todayRevenuePaise),
        cashCollected: Money.toDecimalString(todayCashPaise),
        upiCollected: Money.toDecimalString(todayUpiPaise),
        marketReceivables: Money.toDecimalString(marketReceivablesPaise),
        walletLiability: Money.toDecimalString(walletLiabilityPaise),
        activeSubscriptions: subscriptions.length,
        activeDailyLitres: (activeDailyUnits * 0.5).toFixed(1),
        lowWalletAlerts: lowWalletCount,
      },
      dsePerformance,
      overdueRetailers,
      loadingSheetDate: targetDate,
      loadingSheet,
      recentLedger: ledgerEntries.slice(0, 20).map((l) => ({
        id: l.id,
        entryType: l.entryType,
        partyName: l.user.shopName || l.user.name,
        recordedByName: l.recordedBy.name,
        amount: l.amount.toString(),
        referenceId: l.referenceId,
        notes: l.notes,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }
  async getOverview(loadingDateStr?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetLoadingDate = loadingDateStr
      ? new Date(loadingDateStr)
      : tomorrow;

    const [
      todayDeliveredOrders,
      todayLedger,
      retailerBalances,
      customerWallets,
      activeSubscriptions,
      dseCollections,
      products,
      indentedOrdersForLoading,
      skipDaysForLoading,
    ] = await Promise.all([
      prisma.retailerOrder.findMany({
        where: { status: OrderStatus.DELIVERED, billedAt: { gte: todayStart } },
      }),
      prisma.ledgerTransaction.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.retailerBalance.findMany({
        include: {
          retailer: {
            select: {
              id: true,
              name: true,
              shopName: true,
              phone: true,
              assignedDseId: true,
            },
          },
        },
        orderBy: { currentDue: "desc" },
      }),
      prisma.customerWallet.findMany(),
      prisma.customerSubscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        include: { product: true },
      }),
      usersService.listDses(),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.retailerOrder.findMany({
        where: {
          deliveryDate: targetLoadingDate,
          status: { in: [OrderStatus.INDENTED, OrderStatus.OUT_FOR_DELIVERY] },
        },
        include: { items: true },
      }),
      prisma.customerSkipDay.findMany({
        where: { skipDate: targetLoadingDate },
      }),
    ]);

    let todayRevenuePaise = 0n;
    for (const o of todayDeliveredOrders) {
      todayRevenuePaise += Money.toPaise(o.subtotal.toString());
    }

    let todayCashPaise = 0n;
    let todayUpiPaise = 0n;
    for (const l of todayLedger) {
      if (l.entryType === LedgerEntryType.PAYMENT_CASH_CREDIT) {
        todayCashPaise += Money.toPaise(l.amount.toString());
      } else if (l.entryType === LedgerEntryType.PAYMENT_UPI_CREDIT) {
        todayUpiPaise += Money.toPaise(l.amount.toString());
      }
    }

    let marketReceivablesPaise = 0n;
    for (const b of retailerBalances) {
      marketReceivablesPaise += Money.toPaise(b.currentDue.toString());
    }

    let walletLiabilityPaise = 0n;
    let lowWalletAlertsCount = 0;
    const thresholdPaise = Money.toPaise(env.LOW_WALLET_THRESHOLD_INR);
    for (const w of customerWallets) {
      const bal = Money.toPaise(w.walletBalance.toString());
      walletLiabilityPaise += bal;
      if (bal < thresholdPaise) lowWalletAlertsCount++;
    }

    const skippedCustomerIds = new Set(
      skipDaysForLoading.map((s) => s.customerId),
    );

    // Compute Next-Day Morning Loading Sheet per SKU
    const nextDayLoadingSheet = products.map((product) => {
      let indentedQty = 0;
      for (const ord of indentedOrdersForLoading) {
        for (const item of ord.items) {
          if (item.productId === product.id) {
            indentedQty += item.indentedQty;
          }
        }
      }

      let activeSubQty = 0;
      let skippedQty = 0;
      for (const sub of activeSubscriptions) {
        if (sub.productId === product.id) {
          activeSubQty += sub.dailyQty;
          if (skippedCustomerIds.has(sub.customerId)) {
            skippedQty += sub.dailyQty;
          }
        }
      }

      const totalUnitsNeeded = Math.max(
        0,
        indentedQty + activeSubQty - skippedQty,
      );
      const crates = Math.floor(totalUnitsNeeded / product.unitsPerCrate);
      const looseUnits = totalUnitsNeeded % product.unitsPerCrate;

      return {
        productId: product.id,
        skuCode: product.skuCode,
        name: product.name,
        unitType: product.unitType,
        unitsPerCrate: product.unitsPerCrate,
        indentedQty,
        activeSubQty,
        skippedQty,
        totalUnitsNeeded,
        crates,
        looseUnits,
      };
    });

    return {
      kpis: {
        todayRevenue: Money.toDecimalString(todayRevenuePaise),
        cashCollected: Money.toDecimalString(todayCashPaise),
        upiCollected: Money.toDecimalString(todayUpiPaise),
        marketReceivables: Money.toDecimalString(marketReceivablesPaise),
        customerWalletLiability: Money.toDecimalString(walletLiabilityPaise),
        activeCustomerSubscriptions: activeSubscriptions.length,
        lowWalletCustomerAlerts: lowWalletAlertsCount,
      },
      dseCollections,
      nextDayLoadingSheet,
      overdueRetailers: retailerBalances.slice(0, 10).map((b) => ({
        retailerId: b.retailerId,
        name: b.retailer.name,
        shopName: b.retailer.shopName,
        phone: b.retailer.phone,
        assignedDseId: b.retailer.assignedDseId,
        currentDue: b.currentDue.toString(),
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
