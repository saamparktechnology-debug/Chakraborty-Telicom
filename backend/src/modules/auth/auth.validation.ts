import { z } from "zod";

export const loginBodySchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordBodySchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
});

export const resetPasswordBodySchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(64, "New password cannot exceed 64 characters"),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(64, "New password cannot exceed 64 characters"),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(16, "Valid refresh token is required"),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
