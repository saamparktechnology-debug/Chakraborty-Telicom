import { Router } from "express";
import { Role } from "@prisma/client";
import { retailerOrdersController } from "./retailer-orders.controller";
import {
  authenticate,
  requireRoles,
  enforceSelfOrStaff,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  listOrdersQuerySchema,
  createIndentBodySchema,
  instantBillBodySchema,
  spotBillBodySchema,
  collectDueBodySchema,
} from "./retailer-orders.validation";

const router = Router();

router.use(authenticate);

// GET /api/retailer-orders
router.get(
  "/",
  requireRoles(Role.ADMIN, Role.DSE, Role.RETAILER),
  validateRequest({ query: listOrdersQuerySchema }),
  (req, res, next) => retailerOrdersController.listOrders(req, res, next),
);

// POST /api/retailer-orders/indent
router.post(
  "/indent",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: createIndentBodySchema }),
  (req, res, next) => retailerOrdersController.createIndent(req, res, next),
);

// POST /api/retailer-orders/:id/instant-bill
router.post(
  "/:id/instant-bill",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: instantBillBodySchema }),
  (req, res, next) => retailerOrdersController.instantBill(req, res, next),
);

// POST /api/retailer-orders/spot-bill
router.post(
  "/spot-bill",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: spotBillBodySchema }),
  (req, res, next) => retailerOrdersController.spotBill(req, res, next),
);

// POST /api/retailer-orders/collect-due
router.post(
  "/collect-due",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: collectDueBodySchema }),
  (req, res, next) => retailerOrdersController.collectDue(req, res, next),
);

// GET /api/retailer-orders/retailer/:retailerId
router.get(
  "/retailer/:retailerId",
  requireRoles(Role.ADMIN, Role.DSE, Role.RETAILER),
  enforceSelfOrStaff("retailerId"),
  (req, res, next) =>
    retailerOrdersController.getRetailerPassbook(req, res, next),
);

export default router;
