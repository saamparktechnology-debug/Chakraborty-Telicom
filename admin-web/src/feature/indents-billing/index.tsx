"use client";

import React, { useState } from "react";
import { useIndentsBilling } from "./hooks/useIndentsBilling";
import { OrdersBillingTable } from "./components/OrdersBillingTable";
import { InstantSplitBillModal } from "./components/InstantSplitBillModal";
import { OrderStatus } from "./types/types";
import { formatInr } from "@/lib/export-utils";

export function IndentsBillingFeature() {
  const {
    orders = [],
    retailerOptions = [],
    productOptions = [],
    statusFilter,
    setStatusFilter,
    loading,
    error,
    feedback,
    activeOrderForBill,
    setActiveOrderForBill,
    handleInstantSplitBill,
    handleCreateIndent,
    refreshOrders,
  } = useIndentsBilling();

  const [indentModalOpen, setIndentModalOpen] = useState(false);
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [indentQtyMap, setIndentQtyMap] = useState<Record<string, number>>({});

  const openIndentDialog = () => {
    if (retailerOptions.length > 0 && !selectedRetailerId) {
      setSelectedRetailerId(retailerOptions[0].id);
    }
    const initQty: Record<string, number> = {};
    productOptions.forEach((p, idx) => {
      initQty[p.id] = idx === 0 ? p.unitsPerCrate || 24 : 0;
    });
    setIndentQtyMap(initQty);
    setIndentModalOpen(true);
  };

  const handleIndentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRetailerId = selectedRetailerId || retailerOptions[0]?.id || "";
    const items = Object.entries(indentQtyMap)
      .map(([productId, indentedQty]) => ({
        productId,
        indentedQty: Number(indentedQty || 0),
      }))
      .filter((i) => i.indentedQty > 0);

    if (!targetRetailerId || items.length === 0) return;

    await handleCreateIndent({
      retailerId: targetRetailerId,
      deliveryDate,
      items,
    });
    setIndentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono text-indigo-600 font-semibold">
            /indents-billing
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            Next-Day Indents, Atomic Split-Payment Billing &amp; Option B GST
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | OrderStatus)
            }
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="INDENTED">INDENTED</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED (Billed)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            type="button"
            onClick={refreshOrders}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={openIndentDialog}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            + Punch Next-Day Indent
          </button>
        </div>
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

      {loading ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-500">
          Loading retailer indents and split-payment invoices...
        </div>
      ) : (
        <OrdersBillingTable
          orders={orders}
          onOpenSplitBill={(ord) => setActiveOrderForBill(ord)}
        />
      )}

      <InstantSplitBillModal
        order={activeOrderForBill}
        onClose={() => setActiveOrderForBill(null)}
        onSubmit={handleInstantSplitBill}
      />

      {indentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-600">
                  Morning Dispatch Planning
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  + Punch Next-Day Retailer Indent
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIndentModalOpen(false)}
                className="text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleIndentFormSubmit}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Retailer Shop
                  </label>
                  <select
                    value={selectedRetailerId}
                    onChange={(e) => setSelectedRetailerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {retailerOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.shopName || r.name} ({r.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                {productOptions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatInr(p.retailerPrice)} / {p.unitType} (
                        {p.unitsPerCrate}/crate)
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={indentQtyMap[p.id] ?? 0}
                      onChange={(e) =>
                        setIndentQtyMap((prev) => ({
                          ...prev,
                          [p.id]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-24 px-2.5 py-1 rounded-lg border border-slate-300 text-right font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIndentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Next-Day Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndentsBillingFeature;
