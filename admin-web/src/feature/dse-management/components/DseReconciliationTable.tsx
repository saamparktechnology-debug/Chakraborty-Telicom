"use client";

import React from "react";
import { DseExecutive } from "../types/types";
import { formatInr, downloadCsv } from "@/lib/export-utils";

export function DseReconciliationTable({ dses }: { dses: DseExecutive[] }) {
  const handleExportCsv = () => {
    downloadCsv(
      "dse_cash_upi_reconciliation.csv",
      [
        "DSE Name",
        "Phone",
        "Beat Address",
        "Assigned Retailers",
        "Assigned Customers",
        "Cash Collected (INR)",
        "UPI Collected (INR)",
        "Total Billed (INR)",
      ],
      dses.map((d) => [
        d.name,
        d.phone,
        d.address || "",
        d.assignedRetailers,
        d.assignedCustomers,
        d.todayCashCollected,
        d.todayUpiCollected,
        d.todayTotalBilled,
      ]),
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Daily Cash-in-Hand vs UPI Settlement Audit Table
          </h3>
          <p className="text-xs text-slate-500">
            Reconcile physical cash collected by each salesman against ledger
            entries
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold"
        >
          Export Audit CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase">
              <th className="py-2.5 px-3">DSE Name</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Retailers / Customers</th>
              <th className="py-2.5 px-3 text-right">Today Cash (₹)</th>
              <th className="py-2.5 px-3 text-right">Today UPI (₹)</th>
              <th className="py-2.5 px-3 text-right">Total Billed (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dses.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {d.name}
                </td>
                <td className="py-2.5 px-3 font-mono">{d.phone}</td>
                <td className="py-2.5 px-3">
                  {d.assignedRetailers} shops • {d.assignedCustomers} households
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                  {formatInr(d.todayCashCollected)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                  {formatInr(d.todayUpiCollected)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {formatInr(d.todayTotalBilled)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
