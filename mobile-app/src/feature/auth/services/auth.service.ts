import { apiClient } from "../../../lib/api";
import { AUTH_ENDPOINTS } from "../constants/auth.constants";
import {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from "../types/auth.types";
import { AuthUser } from "../../../store/useAuthStore";

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await apiClient.post(AUTH_ENDPOINTS.LOGIN, payload);
    const data = res.data?.data ?? res.data;
    return {
      token: data.token || data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  },

  async requestPasswordReset(
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> {
    const res = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
    return res.data?.data ?? res.data;
  },

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<{ message: string }> {
    const res = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
    return res.data?.data ?? res.data;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<{ message: string }> {
    const res = await apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, payload);
    return res.data?.data ?? res.data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get(AUTH_ENDPOINTS.ME);
    const data = res.data?.data ?? res.data;
    return data.user ?? data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    } catch {
      // Ignore network errors on logout
    }
  },
};
