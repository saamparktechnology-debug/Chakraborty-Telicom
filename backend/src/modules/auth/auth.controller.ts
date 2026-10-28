import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { env } from "../../config/env";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      res.cookie("amul_access_token", result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000,
      });
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.requestPasswordReset(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.resetPasswordWithOtp(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.changePassword(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.refreshSession(req.body.refreshToken);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logoutSession(req.user?.id, req.body?.refreshToken);
      res.clearCookie("amul_access_token");
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully." });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, user: req.user });
  }
}

export const authController = new AuthController();
