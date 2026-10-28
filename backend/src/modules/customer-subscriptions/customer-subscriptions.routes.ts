import { Router } from "express";
import { Role } from "@prisma/client";
import { customerSubscriptionsController } from "./customer-subscriptions.controller";
import {
  authenticate,
  requireRoles,
  enforceSelfOrStaff,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  walletTopupBodySchema,
  toggleSkipDayBodySchema,
  confirmDeliveryBodySchema,
  sendPeriodicBillBodySchema,
} from "./customer-subscriptions.validation";

const router = Router();

router.use(authenticate);

// POST /api/customers/:id/wallet-topup (Admin only)
router.post(
  "/:id/wallet-topup",
  requireRoles(Role.ADMIN),
  validateRequest({ body: walletTopupBodySchema }),
  (req, res, next) =>
    customerSubscriptionsController.walletTopup(req, res, next),
);

// GET /api/customers/:id/dashboard (Customer own only, DSE, Admin)
router.get(
  "/:id/dashboard",
  requireRoles(Role.ADMIN, Role.DSE, Role.CUSTOMER),
  enforceSelfOrStaff("id"),
  (req, res, next) =>
    customerSubscriptionsController.getDashboard(req, res, next),
);

// POST /api/customers/skip-days/toggle (Customer)
router.post(
  "/skip-days/toggle",
  requireRoles(Role.CUSTOMER, Role.ADMIN),
  validateRequest({ body: toggleSkipDayBodySchema }),
  (req, res, next) =>
    customerSubscriptionsController.toggleSkipDay(req, res, next),
);

// POST /api/customers/deliveries/confirm (DSE, Admin)
router.post(
  "/deliveries/confirm",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: confirmDeliveryBodySchema }),
  (req, res, next) =>
    customerSubscriptionsController.confirmDelivery(req, res, next),
);

// POST /api/customers/:id/send-bill (Admin only)
router.post(
  "/:id/send-bill",
  requireRoles(Role.ADMIN),
  validateRequest({ body: sendPeriodicBillBodySchema }),
  (req, res, next) => customerSubscriptionsController.sendBill(req, res, next),
);

export default router;
