"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

interface GodownStockRow {
  productId: string;
  skuCode: string;
  name: string;
  unitType: string;
  unitsPerCrate: number;
  godownStockQty: number;
  crates: number;
  loose: number;
}

interface DseStockItem {
  productId: string;
  skuCode: string;
  productName: string;
  unitType: string;
  unitsPerCrate: number;
  liveQty: number;
  crates: number;
  loose: number;
}

interface DseInventoryCard {
  dseId: string;
  dseName: string;
  dsePhone: string;
  beat?: string | null;
  items: DseStockItem[];
}

export function StockManagementPanel() {
  const [godownStock, setGodownStock] = useState<GodownStockRow[]>([]);
  const [dseInventory, setDseInventory] = useState<DseInventoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedDseId, setSelectedDseId] = useState<string>("");
  const [cratesInputMap, setCratesInputMap] = useState<Record<string, number>>(
    {},
  );
  const [looseInputMap, setLooseInputMap] = useState<Record<string, number>>(
    {},
  );
  const [mode, setMode] = useState<"INWARD" | "ALLOCATE" | "RETURN">(
    "ALLOCATE",
  );

  const loadStockOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        godownStock: GodownStockRow[];
        dseLiveInventory: DseInventoryCard[];
      }>("/stock/overview");
      setGodownStock(res.godownStock || []);
      setDseInventory(res.dseLiveInventory || []);
      if (!selectedDseId && res.dseLiveInventory?.[0]?.dseId) {
        setSelectedDseId(res.dseLiveInventory[0].dseId);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load stock overview.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDseId]);

  useEffect(() => {
    loadStockOverview();
  }, [loadStockOverview]);

  const buildItemsPayload = () =>
    godownStock
      .map((p) => ({
        productId: p.productId,
        cratesQty: Number(cratesInputMap[p.productId] || 0),
        looseQty: Number(looseInputMap[p.productId] || 0),
      }))
      .filter((i) => i.cratesQty > 0 || i.looseQty > 0);

  const handleExecuteStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    try {
      const items = buildItemsPayload();
      if (mode === "INWARD") {
        await apiRequest("/stock/inward", {
          method: "POST",
          body: JSON.stringify({
            items,
            notes: "Received fresh batch from Amul Dairy",
          }),
        });
        setFeedback("Amul Dairy inward stock added to Main Godown.");
      } else if (mode === "ALLOCATE") {
        await apiRequest("/stock/allocate", {
          method: "POST",
          body: JSON.stringify({
            dseId: selectedDseId,
            items,
            notes: "Morning vehicle stock allocation",
          }),
        });
        setFeedback("Stock allocated from Main Godown to DSE Vehicle.");
      } else {
        await apiRequest("/stock/return", {
          method: "POST",
          body: JSON.stringify({
            dseId: selectedDseId,
            returnAllRemaining: items.length === 0,
            items,
            notes: "End-of-day unsold stock returned to Main Godown",
          }),
        });
        setFeedback(
          "End-of-day unsold stock returned from DSE to Main Godown.",
        );
      }
      setCratesInputMap({});
      setLooseInputMap({});
      await loadStockOverview();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Stock transaction failed.",
      );
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold">
        Loading Live Godown &amp; DSE Vehicle Stock...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Live Inventory &amp; Vehicle Dispatch Tracking
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Amul Main Godown Stock &amp; DSE Vehicle Allocation / EOD Return
          </h2>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("INWARD")}
            className={`px-3 py-1.5 rounded-lg ${
              mode === "INWARD" ? "bg-emerald-600 text-white" : "text-slate-600"
            }`}
          >
            1. + Add Amul Inward Stock
          </button>
          <button
            type="button"
            onClick={() => setMode("ALLOCATE")}
            className={`px-3 py-1.5 rounded-lg ${
              mode === "ALLOCATE"
                ? "bg-indigo-600 text-white"
                : "text-slate-600"
            }`}
          >
            2. Allocate to DSE Vehicle
          </button>
          <button
            type="button"
            onClick={() => setMode("RETURN")}
            className={`px-3 py-1.5 rounded-lg ${
              mode === "RETURN" ? "bg-amber-600 text-white" : "text-slate-600"
            }`}
          >
            3. EOD Return from DSE
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

      <form onSubmit={handleExecuteStockAction} className="space-y-4">
        {mode !== "INWARD" && (
          <div className="max-w-sm">
            <label className="block text-xs font-bold mb-1">
              Select DSE Executive
            </label>
            <select
              value={selectedDseId}
              onChange={(e) => setSelectedDseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              {dseInventory.map((d) => (
                <option key={d.dseId} value={d.dseId}>
                  {d.dseName} ({d.dsePhone})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2.5 px-3">SKU / Product</th>
                <th className="py-2.5 px-3 text-right">Main Godown Stock</th>
                <th className="py-2.5 px-3 text-right">
                  Selected DSE Live Stock
                </th>
                <th className="py-2.5 px-3 text-right">Crates</th>
                <th className="py-2.5 px-3 text-right">Loose Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {godownStock.map((p) => {
                const activeDseCard = dseInventory.find(
                  (d) => d.dseId === selectedDseId,
                );
                const dseRow = activeDseCard?.items.find(
                  (i) => i.productId === p.productId,
                );
                return (
                  <tr key={p.productId}>
                    <td className="py-2 px-3">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.skuCode} • {p.unitsPerCrate} {p.unitType}/crate
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      {p.godownStockQty} ({p.crates}C + {p.loose}L)
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600">
                      {dseRow
                        ? `${dseRow.liveQty} (${dseRow.crates}C + ${dseRow.loose}L)`
                        : "0"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={cratesInputMap[p.productId] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setCratesInputMap((prev) => ({
                            ...prev,
                            [p.productId]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={looseInputMap[p.productId] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setLooseInputMap((prev) => ({
                            ...prev,
                            [p.productId]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {mode === "RETURN"
              ? "Tip: Leave quantities blank and click Return to automatically return 100% of remaining unsold stock from this DSE back to Main Godown."
              : "Stock updates atomically in MySQL and automatically deducts as DSE bills retailers or confirms milk drops."}
          </span>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            {mode === "INWARD"
              ? "+ Add Inward Stock to Godown"
              : mode === "ALLOCATE"
                ? "Allocate Stock to DSE Vehicle"
                : "Record EOD Return to Godown"}
          </button>
        </div>
      </form>
    </div>
  );
}
