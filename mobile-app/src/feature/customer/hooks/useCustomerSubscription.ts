import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { customerService } from "../services/customer.service";
import {
  CustomerTab,
  CustomerDashboardResponse,
} from "../types/customer.types";
import { getErrorMessage } from "../../../lib/api";

export function useCustomerSubscription() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<CustomerTab>("CALENDAR");
  const [dashboard, setDashboard] = useState<CustomerDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getDashboard(user.id);
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const upcomingDates = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, []);

  const handleToggleSkipDate = async (dateStr: string) => {
    if (!user?.id) return;
    setTogglingDate(dateStr);
    setError(null);
    setFeedback(null);
    try {
      const res = await customerService.toggleSkipDate(user.id, dateStr);
      const skipped = res?.skipped;
      setFeedback(
        skipped
          ? `Marked ${dateStr} as "Not Needed — Skip". No milk drop or wallet deduction on this date.`
          : `Restored scheduled milk delivery for ${dateStr}.`,
      );
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingDate(null);
    }
  };

  return {
    user,
    activeTab,
    setActiveTab,
    dashboard,
    walletBalance: dashboard?.walletBalance ?? 0,
    subscriptions: dashboard?.subscriptions ?? [],
    skippedDates: dashboard?.skippedDates ?? [],
    deliveries: dashboard?.deliveries ?? [],
    bills: dashboard?.bills ?? [],
    ledger: dashboard?.ledger ?? [],
    upcomingDates,
    loading,
    togglingDate,
    error,
    feedback,
    refresh: loadDashboard,
    handleToggleSkipDate,
  };
}
