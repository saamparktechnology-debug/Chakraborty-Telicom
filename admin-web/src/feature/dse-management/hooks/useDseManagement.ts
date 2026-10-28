'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DseExecutive, CreateDsePayload } from '../types/types';
import { dseManagementService } from '../services/dse-management.service';

export function useDseManagement() {
  const [dses, setDses] = useState<DseExecutive[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await dseManagementService.getDseList();
      setDses(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load DSEs from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDses();
  }, [loadDses]);

  const filteredDses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dses;
    return dses.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        (d.address || '').toLowerCase().includes(q)
    );
  }, [dses, searchQuery]);

  const handleCreateDse = async (payload: CreateDsePayload) => {
    await dseManagementService.createDse(payload);
    setIsModalOpen(false);
    setFeedback(`DSE account "${payload.name}" (${payload.phone}) created in MySQL.`);
    await loadDses();
  };

  return {
    dses: filteredDses,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    feedback,
    setFeedback,
    handleCreateDse,
    refresh: loadDses,
  };
}
