export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  assignedDseName: string;
  walletBalance: string;
  subscriptionSummary: string;
  dailyDeductionAmount: string;
  productId: string;
  dailyQty: number;
  skippedDates: string[];
}
