'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomerRecord } from '../types/types';
import { customersService } from '../services/customers.service';
import { downloadTablePdf } from '@/lib/export-utils';

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topupTarget, setTopupTarget] = useState<CustomerRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await customersService.listCustomers();
      setCustomers(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleTopUpWallet = async (customerId: string, amount: string, notes: string) => {
    const res = await customersService.topUpWallet(customerId, amount, notes);
    setTopupTarget(null);
    setFeedback(`Prepaid wallet credited (+₹${amount}) in MySQL. New balance: ₹${res.walletBalance}`);
    await loadCustomers();
  };

  const handleConfirmDailyDrop = async (customer: CustomerRecord) => {
    if (!customer.productId) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    try {
      const res = await customersService.confirmDailyDelivery({
        customerId: customer.id,
        productId: customer.productId,
        deliveryDate: todayIso,
        deliveredQty: customer.dailyQty,
      });
      setFeedback(
        `Daily milk drop confirmed for ${customer.name} in MySQL. Wallet balance after deduction: ₹${res.walletBalanceAfter}`
      );
      await loadCustomers();
    } catch (err: unknown) {
      setFeedback(
        err instanceof Error ? err.message : 'Delivery confirmation blocked by wallet policy.'
      );
    }
  };

  const handleSendPeriodicBill = async (customer: CustomerRecord) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const startIso = `${todayIso.slice(0, 8)}01`;
    const res = await customersService.sendPeriodicBill(customer.id, startIso, todayIso);
    downloadTablePdf({
      filename: `${res.bill.billNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`,
      title: `AMUL PARTY — B2C PREPAID MILK SUBSCRIPTION STATEMENT (${res.bill.billNumber})`,
      subtitle: `Customer: ${customer.name} (${customer.phone}) | Period: ${startIso} to ${todayIso}`,
      headers: ['Metric', 'Details'],
      rows: [
        ['Active Daily Subscription', customer.subscriptionSummary],
        ['Total Milk Deliveries Deducted', `INR ${res.bill.deliveriesAmount}`],
        ['Total Wallet Recharges', `INR ${res.bill.topupsAmount}`],
        ['Closing Prepaid Wallet Balance', `INR ${res.bill.closingBalance}`],
      ],
    });
    setFeedback(
      `Periodic statement ${res.bill.billNumber} generated in MySQL for ${customer.name} and downloaded as PDF.`
    );
  };

  return {
    customers,
    loading,
    error,
    topupTarget,
    setTopupTarget,
    feedback,
    setFeedback,
    handleTopUpWallet,
    handleConfirmDailyDrop,
    handleSendPeriodicBill,
  };
}
