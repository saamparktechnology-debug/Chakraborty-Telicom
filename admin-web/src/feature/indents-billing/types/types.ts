export type OrderStatus =
  | "INDENTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemLine {
  productId: string;
  productName: string;
  skuCode?: string;
  indentedQty: number;
  deliveredQty: number;
  unitPrice: string;
  gstPercentage?: number;
  taxableAmount?: string;
  gstAmount?: string;
  lineTotal: string;
}

export interface RetailerOrderRecord {
  id: string;
  invoiceNumber: string;
  retailerId: string;
  retailerShopName: string;
  dseName: string | null;
  deliveryDate: string;
  status: OrderStatus;
  isGstBill?: boolean;
  previousDueSnapshot: string;
  taxableSubtotal?: string;
  gstAmount?: string;
  subtotal: string;
  totalPayable: string;
  paidUpi: string;
  paidCash: string;
  closingDue: string;
  billedAt?: string | null;
  items: OrderItemLine[];
}

export interface InstantSplitBillInput {
  orderId: string;
  isGstBill: boolean;
  deliveredItems: Array<{
    productId: string;
    deliveredQty: number;
  }>;
  paidUpi: string;
  paidCash: string;
  notes?: string;
  // Optional legacy fallback fields so existing callers never break
  deliveredQty?: number;
  unitPrice?: string;
  previousDue?: string;
}

export interface CreateIndentPayload {
  retailerId: string;
  deliveryDate: string;
  items: Array<{
    productId: string;
    indentedQty: number;
  }>;
}

export interface CreateSpotBillPayload {
  retailerId: string;
  isGstBill: boolean;
  deliveredItems: Array<{
    productId: string;
    deliveredQty: number;
  }>;
  paidUpi: string;
  paidCash: string;
  notes?: string;
}

export interface RetailerOptionItem {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  currentDue?: string;
}

export interface ProductOptionItem {
  id: string;
  skuCode: string;
  name: string;
  unitType: string;
  unitsPerCrate: number;
  retailerPrice: string;
  gstPercentage?: number;
  godownStockQty?: number;
  isAvailable: boolean;
}
