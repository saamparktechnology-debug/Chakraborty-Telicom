"use client";

import React from "react";
import { LoadingSheetRow } from "../types/types";
import { API_BASE_URL } from "@/lib/api";

export interface Props {
  date?: string;
  loadingDate?: string;
  onDateChange: (nextDate: string) => void;
  rows: LoadingSheetRow[];
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveUploadUrl(relPath?: string | null): string | null {
  if (!relPath) return null;
  if (relPath.startsWith("http://") || relPath.startsWith("https://"))
    return relPath;
  return `${BACKEND_ORIGIN}${relPath.startsWith("/") ? "" : "/"}${relPath}`;
}

export function NextDayLoadingSheetTable({
  date,
  loadingDate,
  onDateChange,
  rows,
  onExportCsv,
  onExportPdf,
}: Props) {
  const effectiveDate =
    loadingDate || date || new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Next-Day Morning Vehicle Loading Sheet &amp; Product Palette Table
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {effectiveDate}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula:{" "}
            <code className="font-mono text-indigo-600">
              Total Required = Retailer Next-Day Indents + Active B2C Customer
              Subscriptions − Skipped Days
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
          />
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
            >
              Export CSV
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Download PDF Dispatch Sheet
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-500 uppercase">
              <th className="py-2.5 px-3">Picture</th>
              <th className="py-2.5 px-3">SKU &amp; Product Name</th>
              <th className="py-2.5 px-3">Unit / Crate</th>
              <th className="py-2.5 px-3 text-right">Godown Stock</th>
              <th className="py-2.5 px-3 text-right">B2B Indented</th>
              <th className="py-2.5 px-3 text-right">B2C Active Subs</th>
              <th className="py-2.5 px-3 text-right">Skipped (−)</th>
              <th className="py-2.5 px-3 text-right">Total Needed</th>
              <th className="py-2.5 px-3 text-right">
                Vehicle Load (Crates + Loose)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {rows.map((r) => {
              const frontThumb = resolveUploadUrl(
                r.imageFrontUrl || r.imageUrl,
              );
              const backThumb = resolveUploadUrl(r.imageBackUrl);
              return (
                <tr
                  key={r.productId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                        {frontThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={frontThumb}
                            alt={r.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] font-extrabold text-indigo-600 uppercase">
                            {(r.category || r.unitType || "AMUL").slice(0, 4)}
                          </span>
                        )}
                      </div>
                      {backThumb && (
                        <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 overflow-hidden hidden sm:flex items-center justify-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={backThumb}
                            alt={`${r.productName} back`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {r.skuCode}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {r.productName}
                    </div>
                    {r.gstPercentage !== undefined && (
                      <div className="text-[10px] font-mono text-slate-500">
                        GST {r.gstPercentage}%
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {r.unitType} ({r.unitsPerCrate}/crate)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {r.godownStockQty ?? 0}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">
                    {r.indentedQty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                    +{r.activeSubQty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                    −{r.skippedQty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm">
                    {r.totalUnitsNeeded} {r.unitType}s
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold">
                      {r.crates} Crates + {r.loose} {r.unitType}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
