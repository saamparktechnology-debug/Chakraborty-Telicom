'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DseCollectionRow } from '../types/types';
import { OVERVIEW_CHART_COLORS } from '../constants/constants';

export function DseCollectionBarChart({ rows }: { rows: DseCollectionRow[] }) {
  const chartData = rows.map((r) => ({
    name: r.name,
    upi: Number(r.todayUpiCollected || 0),
    cash: Number(r.todayCashCollected || 0),
    billed: Number(r.todayTotalBilled || 0),
  }));

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            DSE &amp; Direct Admin Cash vs UPI Reconciliation
          </h2>
          <p className="text-xs text-slate-500">
            Stacked split-payment collections vs total billing per executive
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Live Audit
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val: number) => `₹${Number(val).toLocaleString('en-IN')}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="upi"
              stackId="collected"
              name="UPI Settled (₹)"
              fill={OVERVIEW_CHART_COLORS.upi}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="cash"
              stackId="collected"
              name="Cash-in-Hand (₹)"
              fill={OVERVIEW_CHART_COLORS.cash}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
