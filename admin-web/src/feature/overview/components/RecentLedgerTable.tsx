'use client';

import React from 'react';
import { RecentLedgerEntry } from '../types/types';
import { LEDGER_ENTRY_BADGE_MAP } from '../constants/constants';
import { formatInr, downloadCsv } from '@/lib/export-utils';

export function RecentLedgerTable({ entries }: { entries: RecentLedgerEntry[] }) {
  const handleExportCsv = () => {
    downloadCsv(
      'amul_immutable_ledger_stream.csv',
      ['Entry Type', 'Reference ID', 'Account Holder', 'Role', 'Recorded By', 'Amount (INR)', 'Notes', 'Timestamp'],
      entries.map((e) => [
        e.entryType,
        e.referenceId || '',
        e.accountHolderName,
        e.accountHolderRole,
        e.recordedByName,
        e.amount,
        e.notes || '',
        e.createdAt,
      ])
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Immutable Financial Ledger Audit Stream (Latest 25 Entries)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time double-entry audit trail across invoices, split UPI/Cash collections, and customer wallets
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
        >
          Export Ledger CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase">
              <th className="py-2.5 px-3">Ledger Type</th>
              <th className="py-2.5 px-3">Reference</th>
              <th className="py-2.5 px-3">Account Holder</th>
              <th className="py-2.5 px-3">Notes</th>
              <th className="py-2.5 px-3">Recorded By</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => {
              const badgeStyle =
                LEDGER_ENTRY_BADGE_MAP[e.entryType] ||
                'bg-slate-100 text-slate-700 border-slate-200';
              const isDebit =
                e.entryType === 'INVOICE_DEBIT' || e.entryType === 'DAILY_DELIVERY_DEBIT';
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle}`}
                    >
                      {e.entryType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">
                    {e.referenceId || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {e.accountHolderName}{' '}
                    <span className="text-[10px] font-mono text-slate-400">
                      ({e.accountHolderRole})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{e.notes || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{e.recordedByName}</td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-extrabold ${
                      isDebit ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isDebit ? '+' : '−'}
                    {formatInr(e.amount)}
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
