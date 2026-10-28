"use client";

import React, { useState } from "react";
import { AdminAuthMode } from "../types/types";

interface LoginFormCardProps {
  mode: AdminAuthMode;
  onSwitchMode: (mode: AdminAuthMode) => void;
  phone: string;
  password: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  generatedOtpHint: string | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  onPhoneChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onOtpChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmitLogin: (e: React.FormEvent) => void;
  onRequestOtp: (e: React.FormEvent) => void;
  onConfirmReset: (e: React.FormEvent) => void;
}

export function LoginFormCard({
  mode,
  onSwitchMode,
  phone,
  password,
  otp,
  newPassword,
  confirmPassword,
  generatedOtpHint,
  loading,
  error,
  successMessage,
  onPhoneChange,
  onPasswordChange,
  onOtpChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmitLogin,
  onRequestOtp,
  onConfirmReset,
}: LoginFormCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      suppressHydrationWarning
      className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md space-y-6"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shrink-0">
          AP
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Amul Party Platform
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "LOGIN"
              ? "Sign In to Control Centre"
              : mode === "FORGOT_REQUEST"
                ? "Reset Forgotten Password"
                : "Verify 6-Digit OTP"}
          </h1>
        </div>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {successMessage}
        </div>
      )}

      {/* MODE 1: SIGN IN */}
      {mode === "LOGIN" && (
        <form
          onSubmit={onSubmitLogin}
          suppressHydrationWarning
          className="space-y-4"
        >
          <div suppressHydrationWarning>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              10-Digit Mobile Number
            </label>
            <input
              suppressHydrationWarning
              type="text"
              required
              maxLength={10}
              autoComplete="username"
              value={phone}
              onChange={(e) =>
                onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              // placeholder="9999999990"
            />
          </div>

          <div suppressHydrationWarning>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              suppressHydrationWarning
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => onSwitchMode("FORGOT_REQUEST")}
              className="text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              Forgot Password? Reset via OTP
            </button>
          </div>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
          >
            {loading ? "Authenticating against MySQL..." : "Sign In"}
          </button>
        </form>
      )}

      {/* MODE 2: REQUEST 6-DIGIT OTP */}
      {mode === "FORGOT_REQUEST" && (
        <form
          onSubmit={onRequestOtp}
          suppressHydrationWarning
          className="space-y-4"
        >
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your registered 10-digit mobile number to generate a 6-digit
            verification OTP.
          </p>

          <div suppressHydrationWarning>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered 10-Digit Mobile Number
            </label>
            <input
              suppressHydrationWarning
              type="text"
              required
              maxLength={10}
              value={phone}
              onChange={(e) =>
                onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              // placeholder="e.g. 9999999990"
            />
          </div>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
          >
            {loading
              ? "Generating 6-Digit OTP..."
              : "Send 6-Digit Verification OTP"}
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode("LOGIN")}
            className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            &larr; Back to Sign In
          </button>
        </form>
      )}

      {/* MODE 3: VERIFY OTP & SET NEW PASSWORD */}
      {mode === "RESET_CONFIRM" && (
        <form
          onSubmit={onConfirmReset}
          suppressHydrationWarning
          className="space-y-4"
        >
          {generatedOtpHint && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  DEV / SANDBOX 6-DIGIT OTP
                </div>
                <div className="text-lg font-mono font-extrabold tracking-widest text-blue-900 mt-0.5">
                  {generatedOtpHint}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOtpChange(generatedOtpHint)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Auto-Fill OTP
              </button>
            </div>
          )}

          <div suppressHydrationWarning>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6-Digit Verification OTP
            </label>
            <input
              suppressHydrationWarning
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) =>
                onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="123456"
            />
          </div>

          <div suppressHydrationWarning>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (min 6 characters)
            </label>
            <input
              suppressHydrationWarning
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter new password"
            />
          </div>

          <div suppressHydrationWarning>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              suppressHydrationWarning
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Re-enter new password"
            />
          </div>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
          >
            {loading
              ? "Updating Password..."
              : "Verify OTP & Save New Password"}
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode("LOGIN")}
            className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            &larr; Cancel &amp; Return to Sign In
          </button>
        </form>
      )}
    </div>
  );
}
