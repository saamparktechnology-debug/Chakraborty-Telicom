import { apiClient } from "../../../lib/api";
import { CUSTOMER_ENDPOINTS } from "../constants/customer.constants";
import { CustomerDashboardResponse } from "../types/customer.types";

function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : fallback;
}

export const customerService = {
  async getDashboard(customerId: string): Promise<CustomerDashboardResponse> {
    const res = await apiClient.get(CUSTOMER_ENDPOINTS.DASHBOARD(customerId));
    const root = res.data?.data ?? res.data ?? {};
    const custObj = (root.customer ?? {}) as Record<string, unknown>;

    const rawSubs: unknown[] = Array.isArray(root.subscriptions)
      ? root.subscriptions
      : [];
    const rawSkips: unknown[] = Array.isArray(root.skipDays)
      ? root.skipDays
      : [];
    const rawDeliveries: unknown[] = Array.isArray(root.deliveries)
      ? root.deliveries
      : [];
    const rawBills: unknown[] = Array.isArray(root.bills) ? root.bills : [];
    const rawLedger: unknown[] = Array.isArray(root.ledger) ? root.ledger : [];

    return {
      customerId: String(custObj.id || customerId),
      name: String(custObj.name || "Customer"),
      phone: String(custObj.phone || ""),
      address: String(custObj.address || ""),
      walletBalance: toNum(root.walletBalance, 0),
      subscriptions: rawSubs.map((s) => {
        const sub = (s ?? {}) as Record<string, unknown>;
        return {
          id: String(sub.id || ""),
          productId: String(sub.productId || ""),
          productName: String(sub.productName || "Amul Milk Pouch"),
          customerPrice: toNum(sub.customerPrice, 28),
          gstPercentage: toNum(sub.gstPercentage, 0),
          dailyQty: toNum(sub.dailyQty, 1),
          status: (sub.status as "ACTIVE" | "PAUSED") || "ACTIVE",
        };
      }),
      skippedDates: rawSkips
        .map((sk) => {
          if (typeof sk === "string") return sk.slice(0, 10);
          const obj = (sk ?? {}) as Record<string, unknown>;
          return String(obj.skipDate || "").slice(0, 10);
        })
        .filter(Boolean),
      deliveries: rawDeliveries.map((d) => {
        const del = (d ?? {}) as Record<string, unknown>;
        return {
          id: String(del.id || ""),
          deliveryDate: String(del.deliveryDate || "").slice(0, 10),
          productName: String(del.productName || "Amul Milk"),
          deliveredQty: toNum(del.deliveredQty, 1),
          isGstBill: Boolean(del.isGstBill),
          gstPercentage: toNum(del.gstPercentage, 0),
          taxableAmount: toNum(del.taxableAmount, 0),
          gstAmount: toNum(del.gstAmount, 0),
          deductedAmount: toNum(del.deductedAmount, 0),
          walletBalanceAfter: toNum(del.walletBalanceAfter, 0),
        };
      }),
      bills: rawBills.map((b) => {
        const bill = (b ?? {}) as Record<string, unknown>;
        return {
          id: String(bill.id || ""),
          billNumber: String(bill.billNumber || ""),
          periodStart: String(bill.periodStart || "").slice(0, 10),
          periodEnd: String(bill.periodEnd || "").slice(0, 10),
          isGstBill: Boolean(bill.isGstBill),
          taxableAmount: toNum(bill.taxableAmount, 0),
          gstAmount: toNum(bill.gstAmount, 0),
          deliveriesAmount: toNum(bill.deliveriesAmount, 0),
          topupsAmount: toNum(bill.topupsAmount, 0),
          closingBalance: toNum(bill.closingBalance, 0),
          sentAt: String(bill.sentAt || ""),
        };
      }),
      ledger: rawLedger.map((l) => {
        const entry = (l ?? {}) as Record<string, unknown>;
        return {
          id: String(entry.id || ""),
          entryType: String(entry.entryType || "DAILY_DELIVERY_DEBIT"),
          amount: toNum(entry.amount, 0),
          referenceId: entry.referenceId ? String(entry.referenceId) : null,
          notes: entry.notes ? String(entry.notes) : null,
          createdAt: String(entry.createdAt || ""),
        };
      }),
    };
  },

  async toggleSkipDate(customerId: string, skipDate: string) {
    const res = await apiClient.post(CUSTOMER_ENDPOINTS.TOGGLE_SKIP_DAY, {
      customerId,
      skipDate,
      reason: "Customer toggled skip date in mobile app",
    });
    return res.data;
  },
};
