'use client';

import React, { useState } from 'react';
import { useOverview } from './hooks/useOverview';
import { KpiCardsGrid } from './components/KpiCardsGrid';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { DseCollectionBarChart } from './components/DseCollectionBarChart';
import { CategorySalesChart } from './components/CategorySalesChart';
import { OrderStatusChart } from './components/OrderStatusChart';
import { NextDayLoadingSheetTable } from './components/NextDayLoadingSheetTable';
import { OverdueRetailersTable } from './components/OverdueRetailersTable';
import { DsePerformanceTable } from './components/DsePerformanceTable';
import { RecentLedgerTable } from './components/RecentLedgerTable';
import { formatInr } from '@/lib/export-utils';

export default function OverviewFeature() {
  const {
    data,
    loadingDate,
    setLoadingDate,
    trendRange,
    setTrendRange,
    loading,
    error,
    collectTarget,
    setCollectTarget,
    actionMessage,
    setActionMessage,
    handleCollectDue,
    refresh,
  } = useOverview();

  const [paidUpi, setPaidUpi] = useState('300.00');
  const [paidCash, setPaidCash] = useState('200.00');
  const [notes, setNotes] = useState('Standalone Khata collection from Overview');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold text-indigo-600">/overview</span>
          <h1 className="text-2xl font-bold text-slate-900">Executive Analytics Dashboard</h1>
          <p className="text-xs text-slate-500">
            100% live MySQL metrics: B2B revenue, split Cash/UPI reconciliation, category breakdown, and morning loading sheet
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
        >
          {loading ? 'Refreshing MySQL Data...' : 'Refresh Live Metrics'}
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="font-bold text-sm">Backend API Connection Required</div>
          <p>{error}</p>
          <p className="text-slate-600">
            Ensure your local MySQL server and backend API (<code className="font-mono">http://localhost:4000/api</code>) are running and seeded (<code className="font-mono">npm run prisma:seed</code>).
          </p>
        </div>
      )}

      {loading && !data && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500 font-medium">
          Querying live KPIs, charts, and ledger tables from MySQL...
        </div>
      )}

      {data && (
        <>
          <KpiCardsGrid kpis={data.kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <RevenueTrendChart
                series={data.revenueTrendSeries}
                range={trendRange}
                onRangeChange={setTrendRange}
              />
            </div>
            <div className="lg:col-span-5">
              <DseCollectionBarChart rows={data.dseCollections} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <CategorySalesChart data={data.categorySalesSeries} />
            </div>
            <div className="lg:col-span-6">
              <OrderStatusChart data={data.orderStatusBreakdown} />
            </div>
          </div>

          <NextDayLoadingSheetTable
            rows={data.nextDayLoadingSheet}
            loadingDate={loadingDate}
            onDateChange={setLoadingDate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <OverdueRetailersTable
                rows={data.overdueRetailers}
                onCollectDueClick={(ret) => setCollectTarget(ret)}
              />
            </div>
            <div className="lg:col-span-6">
              <DsePerformanceTable rows={data.dseCollections} />
            </div>
          </div>

          <RecentLedgerTable entries={data.recentLedgerStream} />
        </>
      )}

      {collectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-600">
                  MySQL Khata Collection
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {collectTarget.shopName || collectTarget.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCollectTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Current Outstanding Due:</span>
              <span className="font-mono font-extrabold text-base text-rose-600">
                {formatInr(collectTarget.currentDue)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">UPI Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidUpi}
                  onChange={(e) => setPaidUpi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl font-mono bg-slate-50 border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Cash Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidCash}
                  onChange={(e) => setPaidCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl font-mono bg-slate-50 border border-slate-300"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold mb-1">Collection Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollectTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCollectDue({
                    retailerId: collectTarget.retailerId,
                    paidUpi,
                    paidCash,
                    notes,
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Post Collection to MySQL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
