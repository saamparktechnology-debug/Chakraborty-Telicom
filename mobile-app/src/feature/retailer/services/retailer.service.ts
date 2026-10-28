import { apiClient } from "../../../lib/api";
import { RETAILER_ENDPOINTS } from "../constants/retailer.constants";
import {
  RetailerPassbookResponse,
  RetailerProductPriceItem,
  RetailerOrderItemSummary,
  RetailerLedgerEntry,
} from "../types/retailer.types";

function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProductRow(
  raw: Record<string, unknown>,
): RetailerProductPriceItem {
  const retailerPrice = toNum(raw.retailerPrice, 0);
  const customerPrice = toNum(raw.customerPrice ?? raw.mrp, retailerPrice);
  const unitType = String(raw.unitType || raw.unitLabel || "Pouch");

  return {
    id: String(raw.id || ""),
    skuCode: String(raw.skuCode || ""),
    name: String(raw.name || "Amul Product"),
    category: String(raw.category || "Dairy"),
    unitType,
    unitsPerCrate: Math.max(1, toNum(raw.unitsPerCrate, 24)),
    retailerPrice,
    customerPrice,
    mrp: customerPrice,
    gstPercentage: toNum(raw.gstPercentage, 0),
    imageUrl: (raw.imageFrontUrl || raw.imageUrl || null) as string | null,
    imageFrontUrl: (raw.imageFrontUrl || raw.imageUrl || null) as string | null,
    isAvailable: raw.isAvailable !== false,
  };
}

export const retailerService = {
  async getPassbook(retailerId: string): Promise<RetailerPassbookResponse> {
    const res = await apiClient.get(
      RETAILER_ENDPOINTS.RETAILER_LEDGER(retailerId),
    );
    const root = res.data?.data ?? res.data ?? {};
    const retObj = (root.retailer ?? {}) as Record<string, unknown>;

    const rawOrders: unknown[] = Array.isArray(root.orders) ? root.orders : [];
    const rawLedger: unknown[] = Array.isArray(root.ledger) ? root.ledger : [];

    const orders: RetailerOrderItemSummary[] = rawOrders.map((o) => {
      const ord = (o ?? {}) as Record<string, unknown>;
      const rawItems: unknown[] = Array.isArray(ord.items) ? ord.items : [];
      return {
        id: String(ord.id || ""),
        invoiceNumber: String(ord.invoiceNumber || ""),
        deliveryDate: String(ord.deliveryDate || "").slice(0, 10),
        status:
          (ord.status as RetailerOrderItemSummary["status"]) || "INDENTED",
        isGstBill: Boolean(ord.isGstBill),
        previousDueSnapshot: toNum(ord.previousDueSnapshot, 0),
        taxableSubtotal: toNum(ord.taxableSubtotal, 0),
        gstAmount: toNum(ord.gstAmount, 0),
        subtotal: toNum(ord.subtotal, 0),
        totalPayable: toNum(ord.totalPayable, 0),
        paidUpi: toNum(ord.paidUpi, 0),
        paidCash: toNum(ord.paidCash, 0),
        closingDue: toNum(ord.closingDue, 0),
        billedAt: ord.billedAt ? String(ord.billedAt) : null,
        items: rawItems.map((it) => {
          const item = (it ?? {}) as Record<string, unknown>;
          const prod = (item.product ?? {}) as Record<string, unknown>;
          return {
            productId: String(item.productId || prod.id || ""),
            productName: String(
              item.productName || prod.name || "Amul Product",
            ),
            skuCode: String(item.skuCode || prod.skuCode || ""),
            indentedQty: toNum(item.indentedQty, 0),
            deliveredQty: toNum(item.deliveredQty, 0),
            unitPrice: toNum(item.unitPrice, 0),
            gstPercentage: toNum(item.gstPercentage ?? prod.gstPercentage, 0),
            taxableAmount: toNum(item.taxableAmount, 0),
            gstAmount: toNum(item.gstAmount, 0),
            lineTotal: toNum(item.lineTotal, 0),
          };
        }),
      };
    });

    const ledger: RetailerLedgerEntry[] = rawLedger.map((l) => {
      const entry = (l ?? {}) as Record<string, unknown>;
      return {
        id: String(entry.id || ""),
        entryType: String(entry.entryType || "INVOICE_DEBIT"),
        amount: toNum(entry.amount, 0),
        referenceId: entry.referenceId ? String(entry.referenceId) : null,
        notes: entry.notes ? String(entry.notes) : null,
        createdAt: String(entry.createdAt || new Date().toISOString()),
        recordedByName: String(entry.recordedByName || "Amul Staff"),
      };
    });

    return {
      retailerId: String(retObj.id || retailerId),
      shopName: String(retObj.shopName || retObj.name || "Retailer Shop"),
      ownerName: String(retObj.name || "Proprietor"),
      phone: String(retObj.phone || ""),
      address: String(retObj.address || ""),
      currentDue: toNum(root.currentDue ?? retObj.currentDue, 0),
      orders,
      ledger,
    };
  },

  async getProducts(): Promise<RetailerProductPriceItem[]> {
    const res = await apiClient.get(RETAILER_ENDPOINTS.PRODUCTS);
    const rawList: unknown[] = Array.isArray(res.data?.products)
      ? res.data.products
      : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

    return rawList.map((item) =>
      normalizeProductRow((item ?? {}) as Record<string, unknown>),
    );
  },
};
