export interface OverviewKpis {
  todayRevenue: string;
  cashCollected: string;
  upiCollected: string;
  marketReceivables: string;
  walletLiability: string;
  activeSubscriptions: number;
  activeDailyLitres: string;
  lowWalletAlerts: number;
}

export interface DsePerformanceRow {
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
}

export interface OverdueRetailerRow {
  retailerId: string;
  shopName: string;
  ownerName: string;
  name?: string;
  phone: string;
  assignedDseName: string | null;
  currentDue: string;
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

export interface ExecutiveOverviewResponse {
  kpis: OverviewKpis;
  dsePerformance: DsePerformanceRow[];
  overdueRetailers: OverdueRetailerRow[];
  loadingSheetDate: string;
  loadingSheet: LoadingSheetRow[];
  recentLedger: RecentLedgerRow[];
}
