"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { RevenueTrendPoint } from "../types/types";
import { OVERVIEW_CHART_COLORS } from "../constants/constants";

interface Props {
  series: RevenueTrendPoint[];
  range: 7 | 14;
  onRangeChange: (r: 7 | 14) => void;
}

export function RevenueTrendChart({ series, range, onRangeChange }: Props) {
  const visibleSeries = series.slice(-range);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {range}-Day B2B Sales vs B2C Prepaid Wallet Deduction Trend
          </h2>
          <p className="text-xs text-slate-500">
            Live daily revenue and collection trajectory queried from MySQL
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => onRangeChange(Number(e.target.value) as 7 | 14)}
          className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 border border-slate-300 font-semibold text-slate-700"
        >
          <option value={14}>Last 14 Days</option>
          <option value={7}>Last 7 Days</option>
        </select>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={visibleSeries}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val: number) =>
                `₹${Number(val).toLocaleString("en-IN")}`
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="b2bSales"
              name="B2B Retailer Billing (₹)"
              stroke={OVERVIEW_CHART_COLORS.b2bSales}
              fill={OVERVIEW_CHART_COLORS.b2bSales}
              fillOpacity={0.16}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="totalCollected"
              name="UPI + Cash Collected (₹)"
              stroke={OVERVIEW_CHART_COLORS.totalCollected}
              fill={OVERVIEW_CHART_COLORS.totalCollected}
              fillOpacity={0.08}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="b2cWallet"
              name="B2C Wallet Deductions (₹)"
              stroke={OVERVIEW_CHART_COLORS.b2cWallet}
              fill={OVERVIEW_CHART_COLORS.b2cWallet}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
