import { useState, useEffect, useCallback } from "react";
import { dseService } from "../services/dse.service";
import {
  DseActiveTab,
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
import { getErrorMessage } from "../../../lib/api";

export function useDseWorkspace() {
  const [activeTab, setActiveTab] = useState<DseActiveTab>("BEAT");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [vehicleStockMap, setVehicleStockMap] = useState<
    Record<string, DseVehicleStockRow>
  >({});
  const [retailers, setRetailers] = useState<RetailerParty[]>([]);
  const [customers, setCustomers] = useState<CustomerParty[]>([]);
  const [orders, setOrders] = useState<RetailerOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodList, stockMap, retList, custList, ordList] =
        await Promise.all([
          dseService.listProducts(),
          dseService.getMyVehicleStock(),
          dseService.listRetailers(),
          dseService.listCustomers(),
          dseService.listOrders(),
        ]);
      setProducts(prodList);
      setVehicleStockMap(stockMap);
      setRetailers(retList);
      setCustomers(custList);
      setOrders(ordList);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const submitIndent = async (input: CreateIndentInput) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await dseService.createIndent(input);
      setFeedback("Next-day indent saved to Morning Loading Sheet!");
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitInstantBill = async (input: InstantBillInput) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await dseService.convertIndentToInstantBill(input);
      setFeedback(
        `Instant ${input.isGstBill ? "GST" : "Non-GST"} Bill posted & DSE Vehicle Stock deducted!`,
      );
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitSpotBill = async (input: SpotBillInput) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await dseService.createSpotBill(input);
      setFeedback(
        `Spot ${input.isGstBill ? "GST" : "Non-GST"} Bill posted & DSE Vehicle Stock deducted!`,
      );
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitCollectDue = async (input: CollectDueInput) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await dseService.collectStandaloneDue(input);
      setFeedback("Standalone Khata due payment recorded!");
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitCustomerDrop = async (payload: {
    customerId: string;
    deliveryDate?: string;
    deliveredQty?: number;
    isGstBill?: boolean;
  }) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await dseService.confirmCustomerDrop(payload);
      setFeedback(
        `Milk drop confirmed! Deducted ₹${res.deductedAmount || ""} from wallet & updated Vehicle Stock.`,
      );
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitOnboardParty = async (input: OnboardPartyInput) => {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await dseService.onboardParty(input);
      setFeedback(`${input.role} onboarded! Default password: Amul@2026!`);
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    products,
    vehicleStockMap,
    retailers,
    customers,
    orders,
    loading,
    submitting,
    error,
    feedback,
    setError,
    setFeedback,
    refresh: loadWorkspace,
    submitIndent,
    submitInstantBill,
    submitSpotBill,
    submitCollectDue,
    submitCustomerDrop,
    submitOnboardParty,
  };
}
