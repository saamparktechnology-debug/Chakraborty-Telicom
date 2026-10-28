export type CustomerTab = "CALENDAR" | "DELIVERIES" | "BILLS" | "PASSBOOK";

export interface CustomerSubscriptionItem {
  id: string;
  productId: string;
  productName: string;
  customerPrice: number;
  gstPercentage: number;
  dailyQty: number;
  status: "ACTIVE" | "PAUSED";
}

export interface CustomerDeliveryItem {
  id: string;
  deliveryDate: string;
  productName: string;
  deliveredQty: number;
  isGstBill: boolean;
  gstPercentage: number;
  taxableAmount: number;
  gstAmount: number;
  deductedAmount: number;
  walletBalanceAfter: number;
}

export interface CustomerMonthlyBillItem {
  id: string;
  billNumber: string;
  periodStart: string;
  periodEnd: string;
  isGstBill: boolean;
  taxableAmount: number;
  gstAmount: number;
  deliveriesAmount: number;
  topupsAmount: number;
  closingBalance: number;
  sentAt: string;
}

export interface CustomerLedgerItem {
  id: string;
  entryType: string;
  amount: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerDashboardResponse {
  customerId: string;
  name: string;
  phone: string;
  address: string;
  walletBalance: number;
  subscriptions: CustomerSubscriptionItem[];
  skippedDates: string[];
  deliveries: CustomerDeliveryItem[];
  bills: CustomerMonthlyBillItem[];
  ledger: CustomerLedgerItem[];
}
