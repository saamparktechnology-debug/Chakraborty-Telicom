"use client";

import { useState, useEffect, useCallback } from "react";
import { indentsBillingService } from "../services/indents-billing.service";
import {
  RetailerOrderRecord,
  OrderStatus,
  InstantSplitBillInput,
  CreateIndentPayload,
  RetailerOptionItem,
  ProductOptionItem,
} from "../types/types";

export function useIndentsBilling() {
  const [orders, setOrders] = useState<RetailerOrderRecord[]>([]);
  const [retailerOptions, setRetailerOptions] = useState<RetailerOptionItem[]>(
    [],
  );
  const [productOptions, setProductOptions] = useState<ProductOptionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeOrderForBill, setActiveOrderForBill] =
    useState<RetailerOrderRecord | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, retailers, products] = await Promise.all([
        indentsBillingService.listOrders(statusFilter),
        indentsBillingService.listRetailerOptions(),
        indentsBillingService.listProductOptions(),
      ]);
      setOrders(list || []);
      setRetailerOptions(retailers || []);
      setProductOptions(products || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load indents and bills.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleInstantSplitBill = async (payload: InstantSplitBillInput) => {
    setError(null);
    setFeedback(null);
    try {
      await indentsBillingService.postInstantSplitBill(payload);
      setActiveOrderForBill(null);
      setFeedback(
        `Atomic ${payload.isGstBill ? "GST" : "Non-GST"} Split-Payment Bill posted and stock deducted!`,
      );
      await fetchOrders();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to post instant bill.",
      );
    }
  };

  const handleCreateIndent = async (payload: CreateIndentPayload) => {
    setError(null);
    setFeedback(null);
    try {
      await indentsBillingService.createIndent(payload);
      setFeedback(
        "Next-day indent saved and added to Morning Vehicle Loading Sheet.",
      );
      await fetchOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create indent.");
    }
  };

  return {
    orders,
    retailerOptions,
    productOptions,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    feedback,
    activeOrderForBill,
    setActiveOrderForBill,
    handleInstantSplitBill,
    handleCreateIndent,
    refreshOrders: fetchOrders,
    refresh: fetchOrders,
  };
}
