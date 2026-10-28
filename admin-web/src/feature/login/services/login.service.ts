import { apiRequest } from "@/lib/api";
import {
  LoginCredentials,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from "../types/types";

export const loginService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async signIn(credentials: LoginCredentials): Promise<LoginResponse> {
    return await this.login(credentials);
  },

  async requestPasswordReset(
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> {
    return await apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<{ success?: boolean; message: string }> {
    return await apiRequest<{ success?: boolean; message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<{ success?: boolean; message: string }> {
    return await apiRequest<{ success?: boolean; message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors during logout
    }
  },
};
