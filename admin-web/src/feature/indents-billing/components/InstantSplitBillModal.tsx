"use client";

import React, { useState, useEffect } from "react";
import { RetailerOrderRecord, InstantSplitBillInput } from "../types/types";
import { formatInr } from "@/lib/export-utils";

interface Props {
  order: RetailerOrderRecord | null;
  onClose: () => void;
  onSubmit: (payload: InstantSplitBillInput) => void;
}

export function InstantSplitBillModal({ order, onClose, onSubmit }: Props) {
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [isGstBill, setIsGstBill] = useState<boolean>(true);
  const [paidUpi, setPaidUpi] = useState("1000");
  const [paidCash, setPaidCash] = useState("250");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      const init: Record<string, number> = {};
      order.items.forEach((i) => {
        init[i.productId] = i.indentedQty;
      });
      setQtyMap(init);
      setIsGstBill(Boolean(order.isGstBill));
    }
  }, [order]);

  if (!order) return null;

  const prevDueNum = parseFloat(order.previousDueSnapshot || "0");

  let subtotalNum = 0;
  let taxableSubtotalNum = 0;
  let gstTotalNum = 0;

  order.items.forEach((item) => {
    const qty = qtyMap[item.productId] ?? item.indentedQty;
    const lineEnteredAmount = qty * parseFloat(item.unitPrice || "0");
    const gstPct = Number(item.gstPercentage ?? 0);

    subtotalNum += lineEnteredAmount;
    if (isGstBill && gstPct > 0) {
      const lineTaxable = (lineEnteredAmount * 100) / (100 + gstPct);
      const lineGst = lineEnteredAmount - lineTaxable;
      taxableSubtotalNum += lineTaxable;
      gstTotalNum += lineGst;
    } else {
      taxableSubtotalNum += lineEnteredAmount;
    }
  });

  const totalPayableNum = prevDueNum + subtotalNum;
  const upiNum = parseFloat(paidUpi || "0");
  const cashNum = parseFloat(paidCash || "0");
  const closingDueNum = totalPayableNum - (upiNum + cashNum);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-indigo-600">
              Atomic Split-Payment &amp; Option B GST / Non-GST Billing
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Deliver &amp; Bill — {order.retailerShopName} (
              {order.invoiceNumber})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>

        {/* GST / Non-GST Billing Mode Selector */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-bold">Select Billing Mode:</span>
          <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsGstBill(true)}
              className={`px-3 py-1 rounded-md transition-all ${
                isGstBill ? "bg-indigo-600 text-white" : "text-slate-600"
              }`}
            >
              GST Billing (Amount + GST = Entered)
            </button>
            <button
              type="button"
              onClick={() => setIsGstBill(false)}
              className={`px-3 py-1 rounded-md transition-all ${
                !isGstBill ? "bg-emerald-600 text-white" : "text-slate-600"
              }`}
            >
              Non-GST Billing
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between py-1 border-b last:border-b-0"
            >
              <div>
                <div className="font-bold">
                  {item.productName}{" "}
                  {isGstBill && Number(item.gstPercentage ?? 0) > 0 && (
                    <span className="text-[10px] font-mono text-indigo-600">
                      (GST {item.gstPercentage}%)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Indented: {item.indentedQty} • Rate:{" "}
                  {formatInr(item.unitPrice)}
                </div>
              </div>
              <input
                type="number"
                min={0}
                value={qtyMap[item.productId] ?? item.indentedQty}
                onChange={(e) =>
                  setQtyMap({
                    ...qtyMap,
                    [item.productId]: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono font-bold"
              />
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950 text-white space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-indigo-200">Previous Running Due:</span>
            <span className="font-mono font-bold">{formatInr(prevDueNum)}</span>
          </div>

          {isGstBill ? (
            <>
              <div className="flex justify-between">
                <span className="text-indigo-200">Taxable Base Amount:</span>
                <span className="font-mono">
                  {formatInr(taxableSubtotalNum)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200">Single GST Amount:</span>
                <span className="font-mono text-emerald-300">
                  +{formatInr(gstTotalNum)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-indigo-100">
                  Today&apos;s Bill (Base + GST = Entered):
                </span>
                <span className="font-mono">{formatInr(subtotalNum)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-semibold">
              <span className="text-indigo-200">
                Today&apos;s Non-GST Bill Amount:
              </span>
              <span className="font-mono">{formatInr(subtotalNum)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-amber-300 border-t border-indigo-800 pt-1">
            <span>Total Payable:</span>
            <span className="font-mono">{formatInr(totalPayableNum)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-indigo-200 mb-1">
                UPI Received (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={paidUpi}
                onChange={(e) => setPaidUpi(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-slate-900 bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-indigo-200 mb-1">
                Cash Received (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={paidCash}
                onChange={(e) => setPaidCash(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-slate-900 bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-between font-extrabold text-emerald-300 border-t border-indigo-800 pt-2 text-sm">
            <span>Closing Due Carried Forward:</span>
            <span className="font-mono">{formatInr(closingDueNum)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit({
                orderId: order.id,
                isGstBill,
                deliveredItems: Object.entries(qtyMap).map(
                  ([productId, deliveredQty]) => ({
                    productId,
                    deliveredQty,
                  }),
                ),
                paidUpi,
                paidCash,
                notes,
              })
            }
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Post Atomic {isGstBill ? "GST" : "Non-GST"} Bill &amp; Deduct Stock
          </button>
        </div>
      </div>
    </div>
  );
}
