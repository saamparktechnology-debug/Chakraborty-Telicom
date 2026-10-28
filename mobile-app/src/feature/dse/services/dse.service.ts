import { apiClient } from "../../../lib/api";
import { DSE_ENDPOINTS } from "../constants/dse.constants";
import {
  ProductItem,
  RetailerParty,
  CustomerParty,
  RetailerOrder,
  DseVehicleStockRow,
  CreateIndentInput,
  InstantBillInput,
  SpotBillInput,
  CollectDueInput,
  OnboardPartyInput,
} from "../types/dse.types";

function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeProduct(raw: Record<string, unknown>): ProductItem {
  const retailerPrice = toNum(raw.retailerPrice);
  const customerPrice = toNum(raw.customerPrice ?? raw.mrp, retailerPrice);
  const unitType = String(raw.unitType || raw.unitLabel || "Pouch");

  return {
    id: String(raw.id || ""),
    skuCode: String(raw.skuCode || ""),
    name: String(raw.name || ""),
    category: String(raw.category || "Dairy"),
    unitType,
    unitLabel: unitType,
    unitsPerCrate: Math.max(1, toNum(raw.unitsPerCrate, 24)),
    retailerPrice,
    customerPrice,
    mrp: customerPrice,
    gstPercentage: toNum(raw.gstPercentage, 0),
    godownStockQty: toNum(raw.godownStockQty, 0),
    imageUrl: (raw.imageFrontUrl || raw.imageUrl || null) as string | null,
    imageFrontUrl: (raw.imageFrontUrl || raw.imageUrl || null) as string | null,
    isAvailable: raw.isAvailable !== false,
  };
}

export const dseService = {
  async listProducts(): Promise<ProductItem[]> {
    const res = await apiClient.get(DSE_ENDPOINTS.PRODUCTS);
    const list = res.data?.products ?? res.data?.data ?? [];
    return (Array.isArray(list) ? list : []).map(normalizeProduct);
  },

  async getMyVehicleStock(): Promise<Record<string, DseVehicleStockRow>> {
    try {
      const res = await apiClient.get(DSE_ENDPOINTS.STOCK_OVERVIEW);
      const data = res.data?.data ?? res.data;
      const dseCards = Array.isArray(data?.dseLiveInventory)
        ? data.dseLiveInventory
        : [];
      const map: Record<string, DseVehicleStockRow> = {};

      if (dseCards.length > 0 && Array.isArray(dseCards[0].items)) {
        for (const item of dseCards[0].items) {
          map[String(item.productId)] = {
            productId: String(item.productId),
            skuCode: String(item.skuCode || ""),
            productName: String(item.productName || ""),
            unitType: String(item.unitType || "Pouch"),
            unitsPerCrate: Math.max(1, toNum(item.unitsPerCrate, 24)),
            liveQty: toNum(item.liveQty, 0),
            crates: toNum(item.crates, 0),
            loose: toNum(item.loose, 0),
          };
        }
      }
      return map;
    } catch {
      return {};
    }
  },

  async listRetailers(): Promise<RetailerParty[]> {
    const res = await apiClient.get(DSE_ENDPOINTS.RETAILERS);
    const list = res.data?.retailers ?? res.data?.data ?? [];
    return (Array.isArray(list) ? list : []).map(
      (r: Record<string, unknown>) => ({
        id: String(r.id || ""),
        name: String(r.name || ""),
        shopName: String(r.shopName || r.name || "Retailer Shop"),
        phone: String(r.phone || ""),
        address: String(r.address || ""),
        currentRunningDue: toNum(r.currentDue ?? r.currentRunningDue, 0),
      }),
    );
  },

  async listCustomers(): Promise<CustomerParty[]> {
    const res = await apiClient.get(DSE_ENDPOINTS.CUSTOMERS);
    const list = res.data?.customers ?? res.data?.data ?? [];
    return (Array.isArray(list) ? list : []).map(
      (c: Record<string, unknown>) => {
        const subs = Array.isArray(c.subscriptions) ? c.subscriptions : [];
        const firstSub = subs[0] as Record<string, unknown> | undefined;
        const subProduct = firstSub?.product as
          | Record<string, unknown>
          | undefined;
        const skipDays = Array.isArray(c.skipDays) ? c.skipDays : [];

        return {
          id: String(c.id || ""),
          name: String(c.name || ""),
          phone: String(c.phone || ""),
          address: String(c.address || ""),
          walletBalance: toNum(c.walletBalance, 0),
          dailySubscriptionQty: toNum(
            firstSub?.dailyQty ?? c.dailySubscriptionQty,
            1,
          ),
          subscribedProductId: String(
            firstSub?.productId ||
              subProduct?.id ||
              c.subscribedProductId ||
              "",
          ),
          subscribedProductName: String(
            subProduct?.name ||
              firstSub?.productName ||
              c.subscribedProductName ||
              "Amul Milk Pouch",
          ),
          customerPrice: toNum(
            subProduct?.customerPrice ?? firstSub?.customerPrice,
            28,
          ),
          gstPercentage: toNum(
            subProduct?.gstPercentage ?? firstSub?.gstPercentage,
            0,
          ),
          skippedDates: skipDays.map((sk: unknown) => {
            if (typeof sk === "string") return sk.slice(0, 10);
            const obj = sk as Record<string, unknown>;
            return String(obj.skipDate || "").slice(0, 10);
          }),
        };
      },
    );
  },

  async listOrders(): Promise<RetailerOrder[]> {
    const res = await apiClient.get(DSE_ENDPOINTS.ORDERS);
    const list = res.data?.orders ?? res.data?.data ?? [];
    return (Array.isArray(list) ? list : []).map(
      (o: Record<string, unknown>) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return {
          id: String(o.id || ""),
          invoiceNumber: String(o.invoiceNumber || ""),
          retailerId: String(o.retailerId || ""),
          retailerShopName: String(
            o.retailerShopName || o.retailerName || "Retailer",
          ),
          deliveryDate: String(o.deliveryDate || "").slice(0, 10),
          status: (o.status as RetailerOrder["status"]) || "INDENTED",
          isGstBill: Boolean(o.isGstBill),
          previousDueSnapshot: toNum(o.previousDueSnapshot, 0),
          taxableSubtotal: toNum(o.taxableSubtotal, 0),
          gstAmount: toNum(o.gstAmount, 0),
          subtotal: toNum(o.subtotal, 0),
          totalPayable: toNum(o.totalPayable, 0),
          paidUpi: toNum(o.paidUpi, 0),
          paidCash: toNum(o.paidCash, 0),
          closingDue: toNum(o.closingDue, 0),
          items: items.map((i: Record<string, unknown>) => ({
            productId: String(i.productId || ""),
            productName: String(i.productName || "Amul Product"),
            skuCode: String(i.skuCode || ""),
            indentedQty: toNum(i.indentedQty, 0),
            deliveredQty: toNum(i.deliveredQty, 0),
            unitPrice: toNum(i.unitPrice, 0),
            gstPercentage: toNum(i.gstPercentage, 0),
            taxableAmount: toNum(i.taxableAmount, 0),
            gstAmount: toNum(i.gstAmount, 0),
            lineTotal: toNum(i.lineTotal, 0),
          })),
        };
      },
    );
  },

  async createIndent(input: CreateIndentInput) {
    const items = input.items
      .map((line) => {
        const upc = Math.max(1, line.unitsPerCrate || 24);
        const indentedQty = line.cratesQty * upc + line.looseUnitsQty;
        return {
          productId: line.productId,
          indentedQty,
        };
      })
      .filter((i) => i.indentedQty > 0);

    const res = await apiClient.post(DSE_ENDPOINTS.CREATE_INDENT, {
      retailerId: input.retailerId,
      deliveryDate: input.deliveryDate,
      items,
    });
    return res.data;
  },

  async convertIndentToInstantBill(input: InstantBillInput) {
    const deliveredItems = input.deliveredItems
      .map((line) => {
        const upc = Math.max(1, line.unitsPerCrate || 24);
        const deliveredQty =
          line.totalUnits !== undefined
            ? line.totalUnits
            : line.cratesQty * upc + line.looseUnitsQty;
        return {
          productId: line.productId,
          deliveredQty,
        };
      })
      .filter((i) => i.deliveredQty >= 0);

    const res = await apiClient.post(
      DSE_ENDPOINTS.INSTANT_BILL(input.orderId),
      {
        isGstBill: Boolean(input.isGstBill),
        deliveredItems,
        paidUpi: input.paidUpi.toFixed(2),
        paidCash: input.paidCash.toFixed(2),
        notes: input.notes,
      },
    );
    return res.data;
  },

  async createSpotBill(input: SpotBillInput) {
    const deliveredItems = input.deliveredItems
      .map((line) => {
        const upc = Math.max(1, line.unitsPerCrate || 24);
        const deliveredQty =
          line.totalUnits !== undefined
            ? line.totalUnits
            : line.cratesQty * upc + line.looseUnitsQty;
        return {
          productId: line.productId,
          deliveredQty,
        };
      })
      .filter((i) => i.deliveredQty > 0);

    const res = await apiClient.post(DSE_ENDPOINTS.SPOT_BILL, {
      retailerId: input.retailerId,
      isGstBill: Boolean(input.isGstBill),
      deliveredItems,
      paidUpi: input.paidUpi.toFixed(2),
      paidCash: input.paidCash.toFixed(2),
      notes: input.notes,
    });
    return res.data;
  },

  async collectStandaloneDue(input: CollectDueInput) {
    const res = await apiClient.post(DSE_ENDPOINTS.COLLECT_DUE, {
      retailerId: input.retailerId,
      paidUpi: input.paidUpi.toFixed(2),
      paidCash: input.paidCash.toFixed(2),
      notes: input.notes,
    });
    return res.data;
  },

  async confirmCustomerDrop(payload: {
    customerId: string;
    deliveryDate?: string;
    deliveredQty?: number;
    isGstBill?: boolean;
  }) {
    const res = await apiClient.post(DSE_ENDPOINTS.CONFIRM_CUSTOMER_DELIVERY, {
      customerId: payload.customerId,
      deliveryDate:
        payload.deliveryDate || new Date().toISOString().slice(0, 10),
      deliveredQty: payload.deliveredQty,
      isGstBill: Boolean(payload.isGstBill),
    });
    return res.data;
  },

  async onboardParty(input: OnboardPartyInput) {
    const body: Record<string, unknown> = {
      role: input.role,
      name: input.name.trim(),
      phone: input.phone.trim(),
      password: input.password || "Amul@2026!",
      address: input.address || "Howrah Beat",
    };
    if (input.role === "RETAILER") {
      body.shopName = input.shopName?.trim() || input.name.trim();
    } else if (input.role === "CUSTOMER" && input.subscribedProductId) {
      body.initialSubscription = {
        productId: input.subscribedProductId,
        dailyQty: Math.max(1, Number(input.dailySubscriptionQty || 1)),
      };
    }
    const res = await apiClient.post(DSE_ENDPOINTS.ONBOARD_USER, body);
    return res.data;
  },
};
