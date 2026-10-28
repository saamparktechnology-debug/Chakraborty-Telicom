import { useState } from "react";
import { useRouter } from "expo-router";
import { authService } from "../services/auth.service";
import { useAuthStore, UserRole } from "../../../store/useAuthStore";
import { getErrorMessage } from "../../../lib/api";

export type AuthScreenMode = "LOGIN" | "FORGOT_REQUEST" | "RESET_CONFIRM";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<AuthScreenMode>("LOGIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);

  const navigateByRole = (role: UserRole) => {
    if (role === "DSE" || role === "ADMIN") {
      router.replace("/(dse)");
    } else if (role === "RETAILER") {
      router.replace("/(retailer)");
    } else if (role === "CUSTOMER") {
      router.replace("/(customer)");
    }
  };

  const switchMode = (nextMode: AuthScreenMode) => {
    setError(null);
    setSuccessMessage(null);
    if (nextMode === "LOGIN") {
      setGeneratedOtpHint(null);
    }
    setMode(nextMode);
  };

  const handleLogin = async (phone: string, password: string) => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
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
      const { token, user } = await authService.login({
        phone: cleanPhone,
        password,
      });
      await setSession(token, user);
      navigateByRole(user.role);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async (phone: string) => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter your registered 10-digit mobile number.");
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await authService.requestPasswordReset({ phone: cleanPhone });
      setSuccessMessage(
        res.message || "6-digit OTP generated for your mobile number.",
      );
      if (res.devOtp) {
        setGeneratedOtpHint(res.devOtp);
      }
      setMode("RESET_CONFIRM");
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (
    phone: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return false;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.resetPassword({
        phone: cleanPhone,
        otp: cleanOtp,
        newPassword,
      });
      setGeneratedOtpHint(null);
      setMode("LOGIN");
      setSuccessMessage(
        res.message ||
          "Password reset complete! Please sign in with your new password.",
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    switchMode,
    handleLogin,
    handleRequestResetOtp,
    handleConfirmResetPassword,
    loading,
    error,
    successMessage,
    generatedOtpHint,
    setError,
    setSuccessMessage,
  };
}
