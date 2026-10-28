'use client';

import React from 'react';
import { CustomerRecord } from '../types/types';
import { formatInr } from '@/lib/export-utils';

interface Props {
  customers: CustomerRecord[];
  onTopUp: (customer: CustomerRecord) => void;
  onConfirmDrop: (customer: CustomerRecord) => void;
  onSendBill: (customer: CustomerRecord) => void;
}

export function CustomersTable({ customers, onTopUp, onConfirmDrop, onSendBill }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
              <th className="py-3 px-4">Customer &amp; Phone</th>
              <th className="py-3 px-4">Assigned DSE</th>
              <th className="py-3 px-4">Active Daily Subscription</th>
              <th className="py-3 px-4">Skipped Dates</th>
              <th className="py-3 px-4 text-right">Prepaid Wallet</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => {
              const isLow = parseFloat(c.walletBalance) < 150;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {c.phone} • {c.address}
                    </div>
                  </td>
                  <td className="py-3 px-4">{c.assignedDseName}</td>
                  <td className="py-3 px-4">{c.subscriptionSummary}</td>
                  <td className="py-3 px-4 font-mono">
                    {c.skippedDates.length > 0 ? (
                      c.skippedDates.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 mr-1"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <div
                      className={`font-extrabold text-sm ${
                        isLow ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatInr(c.walletBalance)}
                    </div>
                    {isLow && (
                      <span className="text-[10px] font-sans font-bold text-rose-600">
                        LOW WALLET ALERT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onTopUp(c)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      + Top Up Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmDrop(c)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Confirm Drop
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendBill(c)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold"
                    >
                      Send PDF Bill
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
