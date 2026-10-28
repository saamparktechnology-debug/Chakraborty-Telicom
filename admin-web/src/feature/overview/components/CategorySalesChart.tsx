'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CategorySalesPoint } from '../types/types';
import { CATEGORY_PIE_COLORS } from '../constants/constants';
import { formatInr } from '@/lib/export-utils';

export function CategorySalesChart({ data }: { data: CategorySalesPoint[] }) {
  const totalRevenue = data.reduce((acc, item) => acc + item.revenue, 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Product Category Sales &amp; Volume Composition
          </h2>
          <p className="text-xs text-slate-500">
            Cumulative B2B revenue and unit volume across Amul product lines
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-600">
          Total: {formatInr(totalRevenue)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey="category"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_PIE_COLORS[entry.category] || '#4f46e5'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => formatInr(val)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2 text-right">Units</th>
                <th className="py-2 px-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50">
                  <td className="py-2 px-2 font-semibold flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_PIE_COLORS[row.category] || '#4f46e5' }}
                    />
                    {row.category}
                  </td>
                  <td className="py-2 px-2 text-right font-mono">{row.unitsSold}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                    {formatInr(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
