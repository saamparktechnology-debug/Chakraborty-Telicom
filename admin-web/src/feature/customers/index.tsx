'use client';

import React from 'react';
import { useCustomers } from './hooks/useCustomers';
import { CustomersTable } from './components/CustomersTable';
import { WalletTopupModal } from './components/WalletTopupModal';

export default function CustomersFeature() {
  const {
    customers,
    topupTarget,
    setTopupTarget,
    handleTopUpWallet,
    handleConfirmDailyDrop,
    handleSendPeriodicBill,
    feedback,
  } = useCustomers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-semibold">/customers</span>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Prepaid Wallet &amp; Periodic Billing Console
          </h1>
          <p className="text-xs text-slate-500">
            Top up B2C household wallets, confirm daily subscription drops, and dispatch periodic PDF statements
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      <CustomersTable
        customers={customers}
        onTopUp={(c) => setTopupTarget(c)}
        onConfirmDrop={handleConfirmDailyDrop}
        onSendBill={handleSendPeriodicBill}
      />

      <WalletTopupModal
        customer={topupTarget}
        onClose={() => setTopupTarget(null)}
        onConfirm={handleTopUpWallet}
      />
    </div>
  );
}
