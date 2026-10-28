"use client";

import React, { useState } from "react";
import { ProductItem } from "../types/types";
import { formatInr } from "@/lib/export-utils";
import { API_BASE_URL } from "@/lib/api";

interface Props {
  products: ProductItem[];
  onEdit: (product: ProductItem) => void;
  onToggleAvailability: (product: ProductItem) => void;
}

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveUploadUrl(relPath?: string | null): string | null {
  if (!relPath) return null;
  if (relPath.startsWith("http://") || relPath.startsWith("https://"))
    return relPath;
  return `${BACKEND_ORIGIN}${relPath.startsWith("/") ? "" : "/"}${relPath}`;
}

export function ProductPaletteGrid({
  products,
  onEdit,
  onToggleAvailability,
}: Props) {
  const [activeSideMap, setActiveSideMap] = useState<
    Record<string, "front" | "back" | "left" | "right">
  >({});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((p) => {
        const selectedSide = activeSideMap[p.id] || "front";
        const sideUrlMap = {
          front: resolveUploadUrl(p.imageFrontUrl || p.imageUrl),
          back: resolveUploadUrl(p.imageBackUrl),
          left: resolveUploadUrl(p.imageLeftUrl),
          right: resolveUploadUrl(p.imageRightUrl),
        };
        const currentImg = sideUrlMap[selectedSide] || sideUrlMap.front;
        const crates = Math.floor(
          (p.godownStockQty || 0) / Math.max(1, p.unitsPerCrate),
        );
        const loose = (p.godownStockQty || 0) % Math.max(1, p.unitsPerCrate);

        return (
          <div
            key={p.id}
            className={`p-4 rounded-2xl border ${
              p.isAvailable
                ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                : "border-rose-200 bg-rose-50/30 opacity-75"
            } flex flex-col justify-between gap-3 shadow-xs`}
          >
            {/* Multi-Angle Picture Viewer */}
            <div className="space-y-2">
              <div className="relative h-40 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {currentImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImg}
                    alt={`${p.name} - ${selectedSide}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-xs font-extrabold uppercase text-indigo-600">
                      {p.category}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      No {selectedSide} image uploaded yet
                    </div>
                  </div>
                )}

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950/85 text-white">
                  GST {Number(p.gstPercentage ?? 0)}%
                </span>

                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.isAvailable
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {p.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              {/* 4-Side Angle Switcher */}
              <div className="grid grid-cols-4 gap-1">
                {(["front", "back", "left", "right"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() =>
                      setActiveSideMap((prev) => ({ ...prev, [p.id]: side }))
                    }
                    className={`py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                      selectedSide === side
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono font-bold text-indigo-600">
                {p.skuCode}
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {p.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                {p.category} • {p.unitType} ({p.unitsPerCrate} units/crate)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">
                  B2B Retailer Price
                </div>
                <div className="font-mono font-bold text-sm">
                  {formatInr(p.retailerPrice)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">
                  B2C Customer MRP
                </div>
                <div className="font-mono font-bold text-sm text-indigo-600">
                  {formatInr(p.customerPrice)}
                </div>
              </div>
            </div>

            {/* Live Main Godown Stock Badge */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Main Godown Stock:
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {p.godownStockQty ?? 0} ({crates}C + {loose}L)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => onToggleAvailability(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-100"
              >
                {p.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Edit / Upload Sides
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
