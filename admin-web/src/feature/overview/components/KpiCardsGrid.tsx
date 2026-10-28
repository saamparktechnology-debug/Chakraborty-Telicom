'use client';

import React from 'react';
import { OverviewKpis } from '../types/types';
import { formatInr } from '@/lib/export-utils';

export function KpiCardsGrid({ kpis }: { kpis: OverviewKpis }) {
  const cards = [
    {
      label: "Today's Revenue",
      value: formatInr(kpis.todayRevenue),
      sub: 'Total B2B delivered billing today',
      accent: 'text-indigo-600',
      borderAccent: 'border-l-4 border-l-indigo-600',
    },
    {
      label: 'Cash Collected',
      value: formatInr(kpis.cashCollected),
      sub: 'Across all DSEs & Direct Admin',
      accent: 'text-emerald-600',
      borderAccent: 'border-l-4 border-l-emerald-600',
    },
    {
      label: 'UPI Collected',
      value: formatInr(kpis.upiCollected),
      sub: 'Verified split UPI credits today',
      accent: 'text-blue-600',
      borderAccent: 'border-l-4 border-l-blue-600',
    },
    {
      label: 'Market Receivables',
      value: formatInr(kpis.marketReceivables),
      sub: `Prepaid Wallet Liability: ${formatInr(kpis.customerWalletLiability)}`,
      accent: 'text-amber-600',
      borderAccent: 'border-l-4 border-l-amber-500',
    },
    {
      label: 'Active Subscriptions',
      value: `${kpis.activeCustomerSubscriptions} Households`,
      sub: `${kpis.scheduledDailyLitres || '0.0'} Litres scheduled/day`,
      accent: 'text-purple-600',
      borderAccent: 'border-l-4 border-l-purple-600',
    },
    {
      label: 'Low-Wallet Alerts',
      value: `${kpis.lowWalletCustomerAlerts} Customers`,
      sub: 'Balance below ₹150.00 threshold',
      accent: kpis.lowWalletCustomerAlerts > 0 ? 'text-rose-600' : 'text-emerald-600',
      borderAccent:
        kpis.lowWalletCustomerAlerts > 0
          ? 'border-l-4 border-l-rose-600'
          : 'border-l-4 border-l-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-white p-4 rounded-2xl border border-slate-200 ${c.borderAccent} shadow-sm flex flex-col justify-between`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {c.label}
          </div>
          <div className={`text-xl font-extrabold font-mono my-2 ${c.accent}`}>{c.value}</div>
          <div className="text-[11px] text-slate-500">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
