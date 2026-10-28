import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "../../middlewares/error.middleware";
import {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./auth.validation";

const OTP_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes

export class AuthService {
  static hashPassword(plain: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plain, salt);
  }

  static verifyPassword(plain: string, storedHash: string): boolean {
    if (storedHash.startsWith("scrypt$")) {
      const [, salt, hash] = storedHash.split("$");
      const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(derived, "hex"),
      );
    }
    return bcrypt.compareSync(plain, storedHash);
  }

  private static hashToken(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  async login(
    input: LoginInput,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user || !user.isActive) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number or password.",
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMin = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new AppError(
        423,
        "ACCOUNT_LOCKED",
        `Account is temporarily locked due to failed login attempts. Try again in ${waitMin} min or reset your password.`,
      );
    }

    const isValid = AuthService.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil:
            attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number or password.",
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const payload = {
      id: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
      shopName: user.shopName,
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = AuthService.hashToken(rawRefreshToken);
    const csrfToken = crypto.randomBytes(24).toString("hex");

    try {
      await prisma.authSession.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          csrfToken,
          ipAddress: meta?.ipAddress?.slice(0, 45) || null,
          userAgent: meta?.userAgent?.slice(0, 255) || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // Ignore if auth_sessions table is not yet migrated
    }

    return {
      token,
      refreshToken: rawRefreshToken,
      user: payload,
    };
  }

  async requestPasswordReset(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user || !user.isActive) {
      throw new AppError(
        404,
        "USER_NOT_FOUND",
        "No active account found with this 10-digit mobile number.",
      );
    }

    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = AuthService.hashToken(`${user.id}:${otp}`);
    const expiresAt = Date.now() + OTP_VALIDITY_MS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: `RESET$${otpHash}$${expiresAt}`,
      },
    });

    try {
      const apiKey = env.SMS_API_KEY;
      if (apiKey && apiKey !== "YOUR_FAST2SMS_API_KEY") {
        await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          {
            route: "otp",
            variables_values: otp,
            numbers: user.phone,
          },
          {
            headers: {
              authorization: apiKey,
              "Content-Type": "application/json",
            },
          },
        );
        logger.info(`SMS OTP successfully dispatched to ${user.phone}`);
      } else {
        logger.info(
          `[Sandbox OTP] Code for ${user.phone} (${user.name}): ${otp}`,
        );
      }
    } catch (smsError) {
      logger.error(
        "Failed to dispatch SMS gateway OTP, falling back to sandbox log",
        smsError as Record<string, unknown>,
      );
    }

    return {
      phone: user.phone,
      expiresInSeconds: 600,
      message:
        "A 6-digit verification OTP has been generated for your mobile number.",
      devOtp: env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  async resetPasswordWithOtp(input: ResetPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user || !user.isActive) {
      throw new AppError(404, "USER_NOT_FOUND", "Account not found.");
    }

    if (!user.mfaSecret || !user.mfaSecret.startsWith("RESET$")) {
      throw new AppError(
        400,
        "NO_ACTIVE_RESET_OTP",
        "No active password reset request found. Please request a new 6-digit OTP.",
      );
    }

    const [, storedHash, expiresAtStr] = user.mfaSecret.split("$");
    const expiresAt = Number(expiresAtStr || 0);

    if (!expiresAt || Date.now() > expiresAt) {
      throw new AppError(
        400,
        "OTP_EXPIRED",
        "Your 6-digit OTP has expired. Please request a new OTP.",
      );
    }

    const candidateHash = AuthService.hashToken(
      `${user.id}:${input.otp.trim()}`,
    );
    const isMatch =
      storedHash.length === candidateHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(storedHash, "hex"),
        Buffer.from(candidateHash, "hex"),
      );

    if (!isMatch) {
      throw new AppError(
        400,
        "INVALID_OTP",
        "Invalid 6-digit OTP code. Please check and try again.",
      );
    }

    const newPasswordHash = AuthService.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mfaSecret: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    try {
      await prisma.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore if auth_sessions table is not present
    }

    return {
      message:
        "Password has been reset successfully. You can now sign in with your new password.",
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new AppError(404, "USER_NOT_FOUND", "User account not found.");
    }

    const isCurrentValid = AuthService.verifyPassword(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new AppError(
        400,
        "INVALID_CURRENT_PASSWORD",
        "Your current password is incorrect.",
      );
    }

    if (input.currentPassword === input.newPassword) {
      throw new AppError(
        400,
        "SAME_PASSWORD",
        "New password must be different from your current password.",
      );
    }

    const newPasswordHash = AuthService.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mfaSecret: null,
      },
    });

    return {
      message: "Your password has been updated.",
    };
  }

  async refreshSession(rawRefreshToken: string) {
    const refreshTokenHash = AuthService.hashToken(rawRefreshToken.trim());
    const session = await prisma.authSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Session expired. Please sign in again.",
      );
    }

    const payload = {
      id: session.user.id,
      role: session.user.role,
      phone: session.user.phone,
      name: session.user.name,
      shopName: session.user.shopName,
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return {
      token,
      user: payload,
    };
  }

  async logoutSession(userId?: string, rawRefreshToken?: string) {
    try {
      if (rawRefreshToken) {
        const refreshTokenHash = AuthService.hashToken(rawRefreshToken.trim());
        await prisma.authSession.updateMany({
          where: { refreshTokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else if (userId) {
        await prisma.authSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // Ignore if auth_sessions table is not present
    }
  }
}

export const authService = new AuthService();
