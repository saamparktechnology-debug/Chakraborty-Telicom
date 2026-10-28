import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
  refreshTokenBodySchema,
} from "./auth.validation";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

// POST /api/auth/login
router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginBodySchema }),
  (req, res, next) => authController.login(req, res, next),
);

// POST /api/auth/forgot-password (Request 6-digit OTP)
router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest({ body: forgotPasswordBodySchema }),
  (req, res, next) => authController.forgotPassword(req, res, next),
);

// POST /api/auth/reset-password (Verify OTP & set new password)
router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest({ body: resetPasswordBodySchema }),
  (req, res, next) => authController.resetPassword(req, res, next),
);

// POST /api/auth/refresh (Exchange refreshToken for new JWT)
router.post(
  "/refresh",
  validateRequest({ body: refreshTokenBodySchema }),
  (req, res, next) => authController.refresh(req, res, next),
);

// POST /api/auth/change-password (Authenticated user changes own password)
router.post(
  "/change-password",
  authenticate,
  validateRequest({ body: changePasswordBodySchema }),
  (req, res, next) => authController.changePassword(req, res, next),
);

// POST /api/auth/logout
router.post("/logout", authenticate, (req, res, next) =>
  authController.logout(req, res, next),
);

// GET /api/auth/me
router.get("/me", authenticate, (req, res) => authController.me(req, res));

export default router;
