export type UserRole = "ADMIN" | "DSE" | "RETAILER" | "CUSTOMER";

export type AdminAuthMode = "LOGIN" | "FORGOT_REQUEST" | "RESET_CONFIRM";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  shopName?: string | null;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ForgotPasswordResponse {
  success?: boolean;
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
