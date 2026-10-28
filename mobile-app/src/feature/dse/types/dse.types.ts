export type DseActiveTab = "BEAT" | "INDENT" | "BILLING" | "DROPS" | "ONBOARD";

export interface ProductItem {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitType: string;
  unitLabel: string;
  unitsPerCrate: number;
  retailerPrice: number;
  customerPrice: number;
  mrp: number;
  gstPercentage: number;
  godownStockQty?: number;
  imageUrl?: string | null;
  imageFrontUrl?: string | null;
  isAvailable: boolean;
}

export interface DseVehicleStockRow {
  productId: string;
  skuCode: string;
  productName: string;
  unitType: string;
  unitsPerCrate: number;
  liveQty: number;
  crates: number;
  loose: number;
}

export interface RetailerParty {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  address?: string;
  currentRunningDue: number;
}

export interface CustomerParty {
  id: string;
  name: string;
  phone: string;
  address?: string;
  walletBalance: number;
  dailySubscriptionQty: number;
  subscribedProductId?: string;
  subscribedProductName?: string;
  customerPrice?: number;
  gstPercentage?: number;
  skippedDates: string[];
}

export interface OrderItemLine {
  productId: string;
  productName: string;
  skuCode?: string;
  indentedQty: number;
  deliveredQty: number;
  unitPrice: number;
  gstPercentage?: number;
  taxableAmount?: number;
  gstAmount?: number;
  lineTotal: number;
}

export interface RetailerOrder {
  id: string;
  invoiceNumber: string;
  retailerId: string;
  retailerShopName: string;
  deliveryDate: string;
  status: "INDENTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  isGstBill?: boolean;
  previousDueSnapshot: number;
  taxableSubtotal?: number;
  gstAmount?: number;
  subtotal: number;
  totalPayable: number;
  paidUpi: number;
  paidCash: number;
  closingDue: number;
  items: OrderItemLine[];
}

export interface CreateIndentInput {
  retailerId: string;
  deliveryDate: string;
  items: Array<{
    productId: string;
    cratesQty: number;
    looseUnitsQty: number;
    unitsPerCrate?: number;
  }>;
}

export interface InstantBillInput {
  orderId: string;
  isGstBill?: boolean;
  deliveredItems: Array<{
    productId: string;
    cratesQty: number;
    looseUnitsQty: number;
    unitsPerCrate?: number;
    totalUnits?: number;
  }>;
  paidUpi: number;
  paidCash: number;
  notes?: string;
}

export interface SpotBillInput {
  retailerId: string;
  isGstBill?: boolean;
  deliveredItems: Array<{
    productId: string;
    cratesQty: number;
    looseUnitsQty: number;
    unitsPerCrate?: number;
    totalUnits?: number;
  }>;
  paidUpi: number;
  paidCash: number;
  notes?: string;
}

export interface CollectDueInput {
  retailerId: string;
  paidUpi: number;
  paidCash: number;
  notes?: string;
}

export interface OnboardPartyInput {
  role: "RETAILER" | "CUSTOMER";
  name: string;
  shopName?: string;
  phone: string;
  password?: string;
  address?: string;
  subscribedProductId?: string;
  dailySubscriptionQty?: number;
}
