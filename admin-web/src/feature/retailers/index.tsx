'use client';

import React from 'react';
import { useRetailers } from './hooks/useRetailers';
import { RetailersTable } from './components/RetailersTable';
import {
  OnboardRetailerModal,
  CollectDueModal,
  KhataPassbookModal,
} from './components/RetailerModals';

export default function RetailersFeature() {
  const {
    retailers,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isOnboardOpen,
    setIsOnboardOpen,
    collectDueTarget,
    setCollectDueTarget,
    passbookTarget,
    setPassbookTarget,
    passbookEntries,
    openPassbook,
    handleOnboardRetailer,
    handleCollectDue,
    feedback,
  } = useRetailers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-semibold">/retailers</span>
          <h1 className="text-2xl font-bold text-slate-900">
            Retailer &amp; Direct Retailer Management
          </h1>
          <p className="text-xs text-slate-500">
            Onboard B2B shops (with or without a DSE), collect standalone dues, and audit Khata passbooks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              All Retailers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DIRECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'DIRECT' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              Direct Retailers (Without DSE)
            </button>
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shop or phone..."
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />

          <button
            type="button"
            onClick={() => setIsOnboardOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            + Onboard Retailer
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      <RetailersTable
        retailers={retailers}
        onCollectDue={(r) => setCollectDueTarget(r)}
        onViewPassbook={openPassbook}
      />

      <OnboardRetailerModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSave={handleOnboardRetailer}
      />

      <CollectDueModal
        retailer={collectDueTarget}
        onClose={() => setCollectDueTarget(null)}
        onSubmit={handleCollectDue}
      />

      <KhataPassbookModal
        retailer={passbookTarget}
        entries={passbookEntries}
        onClose={() => setPassbookTarget(null)}
      />
    </div>
  );
}
