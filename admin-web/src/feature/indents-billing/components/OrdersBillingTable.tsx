"use client";

import React from "react";
import { RetailerOrderRecord } from "../types/types";
import { formatInr, downloadTablePdf } from "@/lib/export-utils";

interface Props {
  orders: RetailerOrderRecord[];
  onOpenSplitBill: (order: RetailerOrderRecord) => void;
  // onSelectForBilling: (order: RetailerOrderRecord) => void;
}

export function OrdersBillingTable({ orders, onOpenSplitBill }: Props) {
  const handleDownloadInvoicePdf = (o: RetailerOrderRecord) => {
    downloadTablePdf({
      filename: `${o.invoiceNumber}.pdf`,
      title: `AMUL PARTY COMMERCIAL INVOICE — ${o.invoiceNumber}`,
      subtitle: `Retailer: ${o.retailerShopName} | Date: ${o.deliveryDate} | Status: ${o.status}`,
      headers: ["Metric", "Amount (INR)"],
      rows: [
        ["Previous Due Snapshot", o.previousDueSnapshot],
        ["Today Delivery Bill Subtotal", o.subtotal],
        ["Total Payable", o.totalPayable],
        ["UPI Received", o.paidUpi],
        ["Cash Received", o.paidCash],
        ["Closing Due Carried Forward", o.closingDue],
      ],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
              <th className="py-3 px-3">Invoice #</th>
              <th className="py-3 px-3">Retailer Shop</th>
              <th className="py-3 px-3">Handled By</th>
              <th className="py-3 px-3">Delivery Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Prev Due</th>
              <th className="py-3 px-3 text-right">Subtotal</th>
              <th className="py-3 px-3 text-right">Paid (UPI + Cash)</th>
              <th className="py-3 px-3 text-right">Closing Due</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                  {o.invoiceNumber}
                </td>
                <td className="py-3 px-3 font-bold text-slate-900">
                  {o.retailerShopName}
                </td>
                <td className="py-3 px-3">
                  {o.dseName || (
                    <span className="font-semibold text-amber-700">
                      Direct Admin
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono">{o.deliveryDate}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatInr(o.previousDueSnapshot)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold">
                  {o.status === "DELIVERED" ? formatInr(o.subtotal) : "Pending"}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600">
                  {o.status === "DELIVERED"
                    ? `UPI ${formatInr(o.paidUpi)} + Cash ${formatInr(o.paidCash)}`
                    : "—"}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                  {o.status === "DELIVERED" ? formatInr(o.closingDue) : "—"}
                </td>
                <td className="py-3 px-3 text-right">
                  {o.status === "INDENTED" ? (
                    <button
                      type="button"
                      onClick={() => onOpenSplitBill(o)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Deliver &amp; Split Bill
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoicePdf(o)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      PDF Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
