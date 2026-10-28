"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginService } from "../services/login.service";
import { AdminAuthMode, UserRole } from "../types/types";

const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  ADMIN: "/overview",
  DSE: "/indents-billing",
  RETAILER: "/indents-billing",
  CUSTOMER: "/customers",
};

export function useLogin() {
  const router = useRouter();

  const [mode, setMode] = useState<AdminAuthMode>("LOGIN");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Reset Password fields
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AdminAuthMode) => {
    setError(null);
    setSuccessMessage(null);
    if (nextMode === "LOGIN") {
      setGeneratedOtpHint(null);
    }
    setMode(nextMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await loginService.login({ phone: cleanPhone, password });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("amul_access_token", res.token);
        if (res.refreshToken) {
          window.localStorage.setItem("amul_refresh_token", res.refreshToken);
        }
        window.localStorage.setItem("amul_user", JSON.stringify(res.user));
      }
      const destination = ROLE_REDIRECT_MAP[res.user.role] || "/overview";
      router.push(destination);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid mobile number or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (cleanPhone.length !== 10) {
      setError("Please enter your registered 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await loginService.requestPasswordReset({
        phone: cleanPhone,
      });
      setSuccessMessage(res.message || "6-digit verification OTP generated.");
      if (res.devOtp) {
        setGeneratedOtpHint(res.devOtp);
      }
      setMode("RESET_CONFIRM");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate password reset OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginService.resetPassword({
        phone: cleanPhone,
        otp: cleanOtp,
        newPassword,
      });
      setPassword(newPassword);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setGeneratedOtpHint(null);
      setMode("LOGIN");
      setSuccessMessage(
        res.message ||
          "Password reset complete! You can now sign in with your new password.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
