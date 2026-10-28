"use client";

import React from "react";
import { useDseManagement } from "./hooks/useDseManagement";
import { DseScorecardGrid } from "./components/DseScorecardGrid";
import { DseReconciliationTable } from "./components/DseReconciliationTable";
import { CreateDseModal } from "./components/CreateDseModal";
import { StockManagementPanel } from "./components/StockManagementPanel";

export function DseManagementFeature() {
  const {
    dses,
    loading,
    error,
    feedback,
    isModalOpen,
    setIsModalOpen,
    handleCreateDse,
  } = useDseManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono text-indigo-600 font-semibold">
            /dse-management
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            DSE Management, Vehicle Stock Allocation &amp; Cash/UPI Audit
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
        >
          + Create DSE Account
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Live Amul Godown Stock, DSE Vehicle Allocation & End-of-Day Return Panel */}
      <StockManagementPanel />

      {loading ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-500">
          Loading DSE executives and collection scorecards...
        </div>
      ) : (
        <>
          <DseScorecardGrid dses={dses} />
          <DseReconciliationTable dses={dses} />
        </>
      )}

      <CreateDseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={(data) => handleCreateDse({ ...data, role: "DSE" })}
        onSubmit={(data) => handleCreateDse({ ...data, role: "DSE" })}
      />
    </div>
  );
}

export default DseManagementFeature;
