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
} from 'recharts';
import { OrderStatusPoint } from '../types/types';
import { formatInr } from '@/lib/export-utils';

export function OrderStatusChart({ data }: { data: OrderStatusPoint[] }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Order &amp; Next-Day Indent Fulfilment Pipeline
        </h2>
        <p className="text-xs text-slate-500">
          Distribution of orders and monetary value by workflow status
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {data.map((st) => (
          <div
            key={st.status}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
          >
            <div className="text-[10px] font-bold uppercase text-slate-500">{st.status}</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 mt-0.5">
              {st.count} Orders
            </div>
            <div className="text-[11px] font-mono text-indigo-600 font-semibold">
              {formatInr(st.totalAmount)}
            </div>
          </div>
        ))}
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="status" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val: number) => formatInr(val)} />
            <Bar dataKey="totalAmount" name="Order Value (₹)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
