'use client';

import React from 'react';
import { DseExecutive } from '../types/types';
import { formatInr } from '@/lib/export-utils';

export function DseScorecardGrid({ dses }: { dses: DseExecutive[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {dses.map((dse) => {
        const totalCollected =
          parseFloat(dse.todayCashCollected || '0') + parseFloat(dse.todayUpiCollected || '0');
        return (
          <div
            key={dse.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  FIELD SALES EXECUTIVE (DSE)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{dse.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {dse.phone} • {dse.address || 'Howrah Beat'}
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-400">Assigned Route</div>
                <div className="font-bold text-slate-800">
                  {dse.assignedRetailers} Retailers • {dse.assignedCustomers} Customers
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] font-semibold uppercase text-emerald-700">
                  Cash-in-Hand
                </div>
                <div className="font-mono font-extrabold text-sm text-emerald-700 mt-0.5">
                  {formatInr(dse.todayCashCollected)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-[10px] font-semibold uppercase text-indigo-700">
                  UPI Settled
                </div>
                <div className="font-mono font-extrabold text-sm text-indigo-700 mt-0.5">
                  {formatInr(dse.todayUpiCollected)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  Total Billed
                </div>
                <div className="font-mono font-extrabold text-sm text-slate-900 mt-0.5">
                  {formatInr(dse.todayTotalBilled)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Pending Next-Day Indents: <strong className="text-slate-900">{dse.pendingDeliveries}</strong>
              </span>
              <span className="font-mono font-semibold text-slate-700">
                Total Collected Today: {formatInr(totalCollected)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
