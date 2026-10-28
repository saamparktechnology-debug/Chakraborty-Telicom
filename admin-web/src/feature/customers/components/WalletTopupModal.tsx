'use client';

import React, { useState } from 'react';
import { CustomerRecord } from '../types/types';
import { formatInr } from '@/lib/export-utils';

export function WalletTopupModal({
  customer,
  onClose,
  onConfirm,
}: {
  customer: CustomerRecord | null;
  onClose: () => void;
  onConfirm: (customerId: string, amount: string, notes: string) => void;
}) {
  const [amount, setAmount] = useState('300.00');
  const [notes, setNotes] = useState('Prepaid recharge collected by Admin');

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            + Top Up Prepaid Wallet — {customer.name}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 font-bold">
            ✕
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Current Wallet Balance:</span>
          <span className="font-mono font-extrabold text-base text-emerald-600">
            {formatInr(customer.walletBalance)}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(customer.id, amount, notes);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-semibold mb-1">Recharge Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Payment Note / Reference</label>
            <input
              type="text"
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
            >
              Credit Prepaid Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
