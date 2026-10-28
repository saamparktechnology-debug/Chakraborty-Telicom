"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RetailerShop,
  OnboardRetailerPayload,
  CollectDuePayload,
  LedgerPassbookEntry,
} from "../types/types";
import { retailersService } from "../services/retailers.service";

export function useRetailers() {
  const [retailers, setRetailers] = useState<RetailerShop[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "DIRECT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [collectDueTarget, setCollectDueTarget] = useState<RetailerShop | null>(
    null,
  );
  const [passbookTarget, setPassbookTarget] = useState<RetailerShop | null>(
    null,
  );
  const [passbookEntries, setPassbookEntries] = useState<LedgerPassbookEntry[]>(
    [],
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadRetailers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await retailersService.listRetailers(activeTab === "DIRECT");
      setRetailers(list);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load retailers from backend.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadRetailers();
  }, [loadRetailers]);

  const handleOnboardRetailer = async (payload: OnboardRetailerPayload) => {
    await retailersService.onboardRetailer(payload);
    setIsOnboardOpen(false);
    setFeedback(
      `Retailer "${payload.shopName}" onboarded in MySQL with ₹0.00 Khata due.`,
    );
    await loadRetailers();
  };

  const handleCollectDue = async (payload: CollectDuePayload) => {
    const res = await retailersService.collectStandaloneDue(payload);
    setCollectDueTarget(null);
    setFeedback(
      `Khata payment recorded in MySQL. Updated balance: ₹${res.currentDue}`,
    );
    await loadRetailers();
  };

  const openPassbook = async (retailer: RetailerShop) => {
    setPassbookTarget(retailer);
    setPassbookEntries([]);
    const res = await retailersService.getPassbook(retailer.id);
    setPassbookEntries(res.ledger || []);
  };

  const filteredRetailers = useMemo(() => {
    return retailers.filter((r) => {
      if (activeTab === "DIRECT" && r.assignedDseId !== null) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (r.shopName || "").toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    });
  }, [retailers, activeTab, searchQuery]);

  return {
    retailers: filteredRetailers,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    isOnboardOpen,
    setIsOnboardOpen,
    collectDueTarget,
    setCollectDueTarget,
    passbookTarget,
    setPassbookTarget,
    passbookEntries,
    feedback,
    setFeedback,
    openPassbook,
    handleOpenPassbook: openPassbook,
    handleOnboardRetailer,
    handleCollectDue,
  };
}
