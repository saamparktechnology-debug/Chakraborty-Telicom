'use client';

import { useState, useEffect, useCallback } from 'react';
import { OverviewResponseData, OverdueRetailerRow } from '../types/types';
import { overviewService } from '../services/overview.service';

export function useOverview() {
  const [data, setData] = useState<OverviewResponseData | null>(null);
  const [loadingDate, setLoadingDate] = useState<string>('');
  const [trendRange, setTrendRange] = useState<7 | 14>(14);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collectTarget, setCollectTarget] = useState<OverdueRetailerRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async (requestedDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await overviewService.fetchOverview(requestedDate || undefined);
      setData(response);
      if (!requestedDate && response.loadingDate) {
        setLoadingDate(response.loadingDate);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load analytics overview from backend API.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(loadingDate || undefined);
  }, [loadData, loadingDate]);

  const handleCollectDue = async (payload: {
    retailerId: string;
    paidUpi: string;
    paidCash: string;
    notes: string;
  }) => {
    const res = await overviewService.collectOverduePayment(payload);
    setCollectTarget(null);
    setActionMessage(`Khata payment recorded in MySQL. Updated due: ₹${res.currentDue}`);
    await loadData(loadingDate || undefined);
  };

  return {
    data,
    loadingDate,
    setLoadingDate,
    trendRange,
    setTrendRange,
    loading,
    error,
    collectTarget,
    setCollectTarget,
    actionMessage,
    setActionMessage,
    handleCollectDue,
    refresh: () => loadData(loadingDate || undefined),
  };
}
