import { apiRequest } from "@/lib/api";
import {
  RetailerOrderRecord,
  CreateIndentPayload,
  InstantSplitBillInput,
  CreateSpotBillPayload,
  RetailerOptionItem,
  ProductOptionItem,
} from "../types/types";

export const indentsBillingService = {
  async listOrders(status?: string): Promise<RetailerOrderRecord[]> {
    const query =
      status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    const res = await apiRequest<{ orders: RetailerOrderRecord[] }>(
      `/retailer-orders${query}`,
    );
    return res.orders || [];
  },

  async listRetailerOptions(): Promise<RetailerOptionItem[]> {
    try {
      const res = await apiRequest<{ retailers: RetailerOptionItem[] }>(
        "/users/retailers",
      );
      return res.retailers || [];
    } catch {
      return [];
    }
  },

  async listProductOptions(): Promise<ProductOptionItem[]> {
    try {
      const res = await apiRequest<{ products: ProductOptionItem[] }>(
        "/products",
      );
      return (res.products || []).filter((p) => p.isAvailable !== false);
    } catch {
      return [];
    }
  },

  async createIndent(
    payload: CreateIndentPayload,
  ): Promise<RetailerOrderRecord> {
    const res = await apiRequest<{ order: RetailerOrderRecord }>(
      "/retailer-orders/indent",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return res.order;
  },

  async postInstantSplitBill(
    payload: InstantSplitBillInput,
  ): Promise<RetailerOrderRecord> {
    const res = await apiRequest<{ order: RetailerOrderRecord }>(
      `/retailer-orders/${payload.orderId}/instant-bill`,
      {
        method: "POST",
        body: JSON.stringify({
          isGstBill: Boolean(payload.isGstBill),
          deliveredItems: payload.deliveredItems,
          paidUpi: payload.paidUpi,
          paidCash: payload.paidCash,
          notes: payload.notes,
        }),
      },
    );
    return res.order;
  },

  async createSpotBill(
    payload: CreateSpotBillPayload,
  ): Promise<RetailerOrderRecord> {
    const res = await apiRequest<{ order: RetailerOrderRecord }>(
      "/retailer-orders/spot-bill",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return res.order;
  },
};
