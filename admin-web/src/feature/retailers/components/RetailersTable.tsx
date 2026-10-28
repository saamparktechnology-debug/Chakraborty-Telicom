'use client';

import React from 'react';
import { RetailerShop } from '../types/types';
import { formatInr } from '@/lib/export-utils';

interface Props {
  retailers: RetailerShop[];
  onCollectDue: (retailer: RetailerShop) => void;
  onViewPassbook: (retailer: RetailerShop) => void;
}

export function RetailersTable({ retailers, onCollectDue, onViewPassbook }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
              <th className="py-3 px-4">Shop Name &amp; Proprietor</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Assigned Beat / DSE</th>
              <th className="py-3 px-4 text-right">Current Due (Khata)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {retailers.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{r.shopName || r.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Prop: {r.name} • {r.address || 'Howrah'}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono">{r.phone}</td>
                <td className="py-3 px-4">
                  {r.assignedDseId ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                      {r.assignedDse?.name || 'DSE Assigned'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      Direct Retailer (No DSE — Handled by Admin)
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                  {formatInr(r.currentDue)}
                </td>
                <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onCollectDue(r)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Collect Due
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewPassbook(r)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold"
                  >
                    View Khata Passbook
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
