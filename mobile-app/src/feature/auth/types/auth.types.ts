import { AuthUser } from "../../../store/useAuthStore";

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ForgotPasswordResponse {
  phone: string;
  expiresInSeconds: number;
  message: string;
  devOtp?: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
