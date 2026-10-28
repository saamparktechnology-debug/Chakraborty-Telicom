"use client";

import React from "react";
import { useLogin } from "./hooks/useLogin";
import { LoginFormCard } from "./components/LoginFormCard";

export function LoginFeature() {
  const {
    mode,
    switchMode,
    phone,
    setPhone,
    password,
    setPassword,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    generatedOtpHint,
    loading,
    error,
    setError,
    successMessage,
    handleSubmit,
    handleRequestOtp,
    handleConfirmReset,
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <LoginFormCard
        mode={mode}
        onSwitchMode={switchMode}
        phone={phone}
        password={password}
        otp={otp}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        generatedOtpHint={generatedOtpHint}
        loading={loading}
        error={error}
        successMessage={successMessage}
        onPhoneChange={(v) => {
          setError(null);
          setPhone(v);
        }}
        onPasswordChange={(v) => {
          setError(null);
          setPassword(v);
        }}
        onOtpChange={(v) => {
          setError(null);
          setOtp(v);
        }}
        onNewPasswordChange={(v) => {
          setError(null);
          setNewPassword(v);
        }}
        onConfirmPasswordChange={(v) => {
          setError(null);
          setConfirmPassword(v);
        }}
        onSubmitLogin={handleSubmit}
        onRequestOtp={handleRequestOtp}
        onConfirmReset={handleConfirmReset}
      />
    </div>
  );
}

export default LoginFeature;
