import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { retailerService } from "../services/retailer.service";
import {
  RetailerTab,
  RetailerPassbookResponse,
  RetailerProductPriceItem,
} from "../types/retailer.types";
import { getErrorMessage } from "../../../lib/api";

export function useRetailerPassbook() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<RetailerTab>("PASSBOOK");
  const [passbook, setPassbook] = useState<RetailerPassbookResponse | null>(
    null,
  );
  const [products, setProducts] = useState<RetailerProductPriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [pbData, prodList] = await Promise.all([
        retailerService.getPassbook(user.id),
        retailerService.getProducts(),
      ]);
      setPassbook(pbData);
      setProducts(Array.isArray(prodList) ? prodList : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    user,
    activeTab,
    setActiveTab,
    passbook,
    currentDue: passbook?.currentDue ?? 0,
    orders: passbook?.orders ?? [],
    ledger: passbook?.ledger ?? [],
    products,
    loading,
    error,
    refresh: loadData,
  };
}
