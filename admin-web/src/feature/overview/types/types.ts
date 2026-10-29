export interface OverviewKpis {
  todayRevenue: string;
  cashCollected: string;
  upiCollected: string;
  marketReceivables: string;
  customerWalletLiability: string;
  activeCustomerSubscriptions: number;
  scheduledDailyLitres: string;
  lowWalletCustomerAlerts: number;
}

export interface DsePerformanceRow {
  id: string;
  dseId: string;
  dseName: string;
  dsePhone: string;
  beat: string;
  cashCollected: string;
  upiCollected: string;
  totalBilled: string;
  assignedRetailers: number;
  assignedCustomers: number;
  pendingIndents: number;
  name: string;
  phone: string;
  cash: number;
  upi: number;
  todayUpiCollected: number;
  todayCashCollected: number;
  todayTotalBilled: number;
  pendingDeliveries: number;
}

export interface DseCollectionRow {
  id: string;
  dseId: string;
  dseName: string;
  dsePhone: string;
  beat: string;
  cashCollected: string | number;
  upiCollected: string | number;
  totalBilled: string | number;
  assignedRetailers: number;
  assignedCustomers: number;
  pendingIndents: number;
  name: string;
  phone: string;
  cash: number;
  upi: number;
  todayUpiCollected: number;
  todayCashCollected: number;
  todayTotalBilled: number;
  pendingDeliveries: number;
}

export interface RevenueTrendPoint {
  date: string;
  label: string;
  b2bRevenue: number;
  b2cRevenue: number;
  totalRevenue: number;
  cashCollected: number;
  upiCollected: number;
}

export interface OverdueRetailerRow {
  id: string;
  retailerId: string;
  shopName: string;
  ownerName: string;
  name: string;
  phone: string;
  assignedDseName: string | null;
  currentDue: string;
  address?: string | null;
  assignedDseId?: number;
}

export interface LoadingSheetRow {
  productId: string;
  skuCode: string;
  productName: string;
  category?: string;
  unitType: string;
  unitsPerCrate: number;
  retailerPrice?: string;
  customerPrice?: string;
  gstPercentage?: number;
  godownStockQty?: number;
  imageUrl?: string | null;
  imageFrontUrl?: string | null;
  imageBackUrl?: string | null;
  imageLeftUrl?: string | null;
  imageRightUrl?: string | null;
  indentedQty: number;
  activeSubQty: number;
  skippedQty: number;
  totalUnitsNeeded: number;
  crates: number;
  loose: number;
}

export interface RecentLedgerRow {
  id: string;
  entryType: string;
  partyName: string;
  recordedByName: string;
  amount: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RecentLedgerEntry {
  id: string;
  entryType: string;
  accountHolderName: string;
  accountHolderRole: string;
  amount: string;
  recordedByName: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CategorySalesPoint {
  category: string;
  unitsSold: number;
  revenue: number;
}
export interface OrderStatusPoint {
  status: string;
  count: number;
  totalAmount: number;
}

export interface ExecutiveOverviewResponse {
  kpis: OverviewKpis;
  dsePerformance: DsePerformanceRow[];
  dseCollections?: DseCollectionRow[];
  revenueTrend?: RevenueTrendPoint[];
  overdueRetailers: OverdueRetailerRow[];
  loadingSheetDate: string;
  loadingSheet: LoadingSheetRow[];
  recentLedger: RecentLedgerRow[];
  categorySales?: CategorySalesPoint[];
}

export interface OverviewResponseData {
  kpis: OverviewKpis;

  dsePerformance: DsePerformanceRow[];
  dseCollections: DseCollectionRow[];

  revenueTrendSeries: RevenueTrendPoint[];

  overdueRetailers: OverdueRetailerRow[];

  loadingDate: string;
  nextDayLoadingSheet: LoadingSheetRow[];

  recentLedgerStream: RecentLedgerEntry[];

  categorySalesSeries: CategorySalesPoint[];
  orderStatusBreakdown: OrderStatusPoint[];
}
