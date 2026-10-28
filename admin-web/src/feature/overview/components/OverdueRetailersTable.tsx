'use client';

import React from 'react';
import { OverdueRetailerRow } from '../types/types';
import { formatInr, downloadCsv } from '@/lib/export-utils';

interface Props {
  rows: OverdueRetailerRow[];
  onCollectDueClick: (retailer: OverdueRetailerRow) => void;
}

export function OverdueRetailersTable({ rows, onCollectDueClick }: Props) {
  const totalDue = rows.reduce((acc, r) => acc + parseFloat(r.currentDue || '0'), 0);

  const handleExportCsv = () => {
    downloadCsv(
      'amul_overdue_retailers_khata.csv',
      ['Shop Name', 'Proprietor', 'Phone', 'Address', 'Assigned Beat', 'Current Due (INR)'],
      rows.map((r) => [
        r.shopName || r.name,
        r.name,
        r.phone,
        r.address || '',
        r.assignedDseName || 'Direct Admin (No DSE)',
        r.currentDue,
      ])
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Top Overdue Retailers (Market Receivables Khata)
          </h2>
          <p className="text-xs text-slate-500">
            Total Outstanding Receivables: <strong className="font-mono text-rose-600">{formatInr(totalDue)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200"
        >
          Export Dues CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase">
              <th className="py-2.5 px-3">Shop / Proprietor</th>
              <th className="py-2.5 px-3">Assigned Beat</th>
              <th className="py-2.5 px-3 text-right">Current Due (₹)</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.retailerId} className="hover:bg-slate-50">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-900">{r.shopName || r.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {r.name} • {r.phone}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  {r.assignedDseId ? (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {r.assignedDseName || 'Assigned DSE'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      Direct Admin (No DSE)
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                  {formatInr(r.currentDue)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => onCollectDueClick(r)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Collect Due
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
