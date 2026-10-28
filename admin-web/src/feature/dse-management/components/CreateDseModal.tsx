"use client";

import React, { useState } from "react";
import { CreateDsePayload } from "../types/types";

export interface CreateDseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (payload: CreateDsePayload) => void | Promise<void>;
  onSubmit?: (payload: CreateDsePayload) => void | Promise<void>;
}

export function CreateDseModal({
  isOpen,
  onClose,
  onCreate,
  onSubmit,
}: CreateDseModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateDsePayload = {
      role: "DSE",
      name: name.trim(),
      phone: phone.trim(),
      password,
      address: address.trim() || "Assigned Beat",
    };
    const handler = onCreate || onSubmit;
    if (handler) {
      await handler(payload);
    }
    setName("");
    setPhone("");
    setAddress("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Field Executive Onboarding
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              + Create DSE Account
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amitava Roy DSE"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              10-Digit Mobile Number
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="9830011223"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Initial Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Assigned Beat / Route Area
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Bally & Uttarpara Beat"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Create DSE Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
