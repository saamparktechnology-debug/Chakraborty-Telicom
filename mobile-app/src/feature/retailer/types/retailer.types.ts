export type RetailerTab = "PASSBOOK" | "ORDERS" | "PRICE_LIST";

export interface RetailerLedgerEntry {
  id: string;
  entryType: string;
  amount: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  recordedByName: string;
}

export interface RetailerOrderItem {
  productId: string;
  productName: string;
  skuCode: string;
  indentedQty: number;
  deliveredQty: number;
  unitPrice: number;
  gstPercentage: number;
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface RetailerOrderItemSummary {
  id: string;
  invoiceNumber: string;
  deliveryDate: string;
  status: "INDENTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  isGstBill: boolean;
  previousDueSnapshot: number;
  taxableSubtotal: number;
  gstAmount: number;
  subtotal: number;
  totalPayable: number;
  paidUpi: number;
  paidCash: number;
  closingDue: number;
  billedAt: string | null;
  items: RetailerOrderItem[];
}

export interface RetailerProductPriceItem {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitType: string;
  unitsPerCrate: number;
  retailerPrice: number;
  customerPrice: number;
  mrp: number;
  gstPercentage: number;
  imageUrl: string | null;
  imageFrontUrl: string | null;
  isAvailable: boolean;
}

export interface RetailerPassbookResponse {
  retailerId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  currentDue: number;
  orders: RetailerOrderItemSummary[];
  ledger: RetailerLedgerEntry[];
}
