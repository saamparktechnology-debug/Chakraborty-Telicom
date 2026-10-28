'use client';

import React from 'react';
import { DseCollectionRow } from '../types/types';
import { formatInr, downloadCsv } from '@/lib/export-utils';

export function DsePerformanceTable({ rows }: { rows: DseCollectionRow[] }) {
  const handleExportCsv = () => {
    downloadCsv(
      'amul_dse_cash_upi_audit.csv',
      ['Executive / Channel', 'Phone', 'Retailers', 'Customers', 'Pending Indents', 'Cash Collected (INR)', 'UPI Collected (INR)', 'Total Billed (INR)'],
      rows.map((r) => [
        r.name,
        r.phone,
        r.assignedRetailers,
        r.assignedCustomers,
        r.pendingDeliveries,
        r.todayCashCollected,
        r.todayUpiCollected,
        r.todayTotalBilled,
      ])
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Field Executive (DSE) &amp; Direct Admin Cash-in-Hand Audit
          </h2>
          <p className="text-xs text-slate-500">
            Daily Cash vs UPI collections and beat assignments from MySQL
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
        >
          Export Audit CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase">
              <th className="py-2.5 px-3">Executive / Channel</th>
              <th className="py-2.5 px-3 text-center">Beat Accounts</th>
              <th className="py-2.5 px-3 text-right">Cash-in-Hand</th>
              <th className="py-2.5 px-3 text-right">UPI Settled</th>
              <th className="py-2.5 px-3 text-right">Total Billed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-900">{r.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{r.phone}</div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="font-semibold text-slate-800">{r.assignedRetailers} Ret</span>
                  {' • '}
                  <span className="text-slate-600">{r.assignedCustomers} Cust</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                  {formatInr(r.todayCashCollected)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                  {formatInr(r.todayUpiCollected)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                  {formatInr(r.todayTotalBilled)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
