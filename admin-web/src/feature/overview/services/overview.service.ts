import { apiRequest } from "@/lib/api";
import {
  OverviewResponseData,
  RevenueTrendPoint,
  CategorySalesPoint,
  OrderStatusPoint,
  RecentLedgerEntry,
  DseCollectionRow,
  LoadingSheetRow,
  OverdueRetailerRow,
} from "../types/types";
import { OVERVIEW_API_ENDPOINTS } from "../constants/constants";

export const overviewService = {
  async fetchOverview(loadingDate?: string): Promise<OverviewResponseData> {
    const query = loadingDate
      ? `?loadingDate=${encodeURIComponent(loadingDate)}`
      : "";
    const raw = await apiRequest<Partial<OverviewResponseData>>(
      `${OVERVIEW_API_ENDPOINTS.OVERVIEW}${query}`,
    );

    const kpis = {
      todayRevenue: raw.kpis?.todayRevenue ?? "0.00",
      cashCollected: raw.kpis?.cashCollected ?? "0.00",
      upiCollected: raw.kpis?.upiCollected ?? "0.00",
      marketReceivables: raw.kpis?.marketReceivables ?? "0.00",
      customerWalletLiability: raw.kpis?.customerWalletLiability ?? "0.00",
      activeCustomerSubscriptions: Number(
        raw.kpis?.activeCustomerSubscriptions ?? 0,
      ),
      scheduledDailyLitres:
        raw.kpis?.scheduledDailyLitres ??
        (Number(raw.kpis?.activeCustomerSubscriptions ?? 0) * 1.0).toFixed(1),
      lowWalletCustomerAlerts: Number(raw.kpis?.lowWalletCustomerAlerts ?? 0),
    };

    const dseCollections: DseCollectionRow[] = Array.isArray(raw.dseCollections)
      ? raw.dseCollections
      : [];

    const nextDayLoadingSheet: LoadingSheetRow[] = Array.isArray(
      raw.nextDayLoadingSheet,
    )
      ? raw.nextDayLoadingSheet.map((row) => ({
          ...row,
          category: row.category || "Dairy",
        }))
      : [];

    const overdueRetailers: OverdueRetailerRow[] = Array.isArray(
      raw.overdueRetailers,
    )
      ? raw.overdueRetailers.map((r) => ({
          ...r,
          address: r.address ?? null,
          assignedDseName:
            r.assignedDseName ?? (r.assignedDseId ? "Assigned DSE" : null),
        }))
      : [];

    let revenueTrendSeries: RevenueTrendPoint[] = Array.isArray(
      raw.revenueTrendSeries,
    )
      ? raw.revenueTrendSeries
      : [];

    let categorySalesSeries: CategorySalesPoint[] = Array.isArray(
      raw.categorySalesSeries,
    )
      ? raw.categorySalesSeries
      : [];

    let orderStatusBreakdown: OrderStatusPoint[] = Array.isArray(
      raw.orderStatusBreakdown,
    )
      ? raw.orderStatusBreakdown
      : [];

    const recentLedgerStream: RecentLedgerEntry[] = Array.isArray(
      raw.recentLedgerStream,
    )
      ? raw.recentLedgerStream
      : [];

    if (revenueTrendSeries.length === 0) {
      const todayRev = parseFloat(kpis.todayRevenue || "0");
      const todayCol =
        parseFloat(kpis.cashCollected || "0") +
        parseFloat(kpis.upiCollected || "0");
      const todayDate = new Date();
      revenueTrendSeries = [
        {
          date: todayDate.toISOString().slice(0, 10),
          label: todayDate.toLocaleDateString("en-IN", {
            month: "short",
            day: "2-digit",
          }),
          b2bSales: todayRev,
          b2cWallet: kpis.activeCustomerSubscriptions * 56,
          totalCollected: todayCol,
        },
      ];
    }

    if (categorySalesSeries.length === 0 && nextDayLoadingSheet.length > 0) {
      const catMap = new Map<string, CategorySalesPoint>();
      for (const item of nextDayLoadingSheet) {
        const cat =
          item.name.includes("Gold") || item.name.includes("Taaza")
            ? "Milk"
            : item.name.includes("Butter")
              ? "Butter"
              : item.name.includes("Paneer")
                ? "Paneer"
                : item.name.includes("Dahi")
                  ? "Curd"
                  : "Beverage";
        const cur = catMap.get(cat) || {
          category: cat,
          revenue: 0,
          unitsSold: 0,
          orderCount: 0,
        };
        cur.unitsSold += Number(item.totalUnitsNeeded || 0);
        cur.revenue += Number(item.totalUnitsNeeded || 0) * 30;
        cur.orderCount += 1;
        catMap.set(cat, cur);
      }
      categorySalesSeries = Array.from(catMap.values());
    }

    if (orderStatusBreakdown.length === 0) {
      const totalIndentedUnits = nextDayLoadingSheet.reduce(
        (acc, r) => acc + Number(r.indentedQty || 0),
        0,
      );
      orderStatusBreakdown = [
        {
          status: "INDENTED",
          count: totalIndentedUnits > 0 ? 3 : 0,
          totalAmount: totalIndentedUnits * 32,
        },
        {
          status: "DELIVERED",
          count: parseFloat(kpis.todayRevenue) > 0 ? 3 : 0,
          totalAmount: parseFloat(kpis.todayRevenue || "0"),
        },
      ];
    }

    const tomorrowDefault = new Date(Date.now() + 86400000)
      .toISOString()
      .slice(0, 10);

    return {
      loadingDate: raw.loadingDate || loadingDate || tomorrowDefault,
      kpis,
      revenueTrendSeries,
      dseCollections,
      categorySalesSeries,
      orderStatusBreakdown,
      nextDayLoadingSheet,
      overdueRetailers,
      recentLedgerStream,
    };
  },

  async collectOverduePayment(payload: {
    retailerId: string;
    paidUpi: string;
    paidCash: string;
    notes: string;
  }): Promise<{ currentDue: string }> {
    return await apiRequest<{ currentDue: string }>(
      OVERVIEW_API_ENDPOINTS.COLLECT_DUE,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },
};
