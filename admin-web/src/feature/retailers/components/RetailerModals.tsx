"use client";

import React, { useState } from "react";
import {
  RetailerShop,
  OnboardRetailerPayload,
  CollectDuePayload,
  LedgerPassbookEntry,
} from "../types/types";
import { formatInr, downloadTablePdf } from "@/lib/export-utils";

export function OnboardRetailerModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: OnboardRetailerPayload) => void;
}) {
  const [shopName, setShopName] = useState("Maa Tara Sweet & Dairy");
  const [name, setName] = useState("Debashis Das");
  const [phone, setPhone] = useState("9831122334");
  const [address, setAddress] = useState("GT Road, Howrah");
  const [assignedDseId, setAssignedDseId] = useState<string>("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            + Onboard B2B Retailer
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              shopName,
              name,
              phone,
              address,
              assignedDseId: assignedDseId || null,
            });
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-semibold mb-1">Shop Name</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Proprietor Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              10-Digit Phone Number
            </label>
            <input
              type="text"
              required
              pattern="\d{10}"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Assigned DSE (or Direct Admin)
            </label>
            <select
              value={assignedDseId}
              onChange={(e) => setAssignedDseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            >
              <option value="">
                None — Direct Retailer (Handled by Admin)
              </option>
              <option value="u-dse-1">Rahul DSE (9999999991)</option>
              <option value="u-dse-2">Vikram DSE (9999999992)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
            >
              Onboard Retailer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CollectDueModal({
  retailer,
  onClose,
  onSubmit,
}: {
  retailer: RetailerShop | null;
  onClose: () => void;
  onSubmit: (payload: CollectDuePayload) => void;
}) {
  const [paidUpi, setPaidUpi] = useState("300");
  const [paidCash, setPaidCash] = useState("200");
  const [notes, setNotes] = useState("Standalone Khata settlement");

  if (!retailer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Collect Due — {retailer.shopName || retailer.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            Current Outstanding Due:
          </span>
          <span className="font-mono font-extrabold text-base text-rose-600">
            {formatInr(retailer.currentDue)}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ retailerId: retailer.id, paidUpi, paidCash, notes });
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">
                UPI Received (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidUpi}
                onChange={(e) => setPaidUpi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Cash Received (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidCash}
                onChange={(e) => setPaidCash(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Reference Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
            >
              Record Payment &amp; Update Khata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function KhataPassbookModal({
  retailer,
  entries,
  onClose,
}: {
  retailer: RetailerShop | null;
  entries: LedgerPassbookEntry[];
  onClose: () => void;
}) {
  if (!retailer) return null;

  const handleDownloadPdf = () => {
    downloadTablePdf({
      filename: `Khata_Passbook_${retailer.phone}.pdf`,
      title: `AMUL PARTY KHATA PASSBOOK — ${retailer.shopName || retailer.name}`,
      subtitle: `Phone: ${retailer.phone} | Current Net Due: INR ${retailer.currentDue}`,
      headers: [
        "Entry Type",
        "Reference",
        "Notes",
        "Timestamp",
        "Amount (INR)",
      ],
      rows: entries.map((e) => [
        e.entryType,
        e.referenceId || "—",
        e.notes || "",
        e.createdAt,
        e.amount,
      ]),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-indigo-600">
              Chronological Ledger Passbook
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {retailer.shopName || retailer.name} ({retailer.phone})
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

        <div className="p-4 rounded-xl bg-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-200">
              Net Current Due (Khata)
            </div>
            <div className="text-xl font-mono font-extrabold text-amber-300">
              {formatInr(retailer.currentDue)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold"
          >
            Download Passbook PDF
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2 px-3">Entry Type</th>
                <th className="py-2 px-3">Notes / Reference</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => {
                const isDebit = e.entryType === "INVOICE_DEBIT";
                return (
                  <tr key={e.id}>
                    <td
                      className={`py-2 px-3 font-mono font-bold ${
                        isDebit ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {e.entryType}
                    </td>
                    <td className="py-2 px-3">{e.notes || e.referenceId}</td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        isDebit ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isDebit ? "+" : "−"}
                      {formatInr(e.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
