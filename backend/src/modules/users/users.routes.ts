import { Router } from "express";
import { Role } from "@prisma/client";
import { usersController } from "./users.controller";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  onboardUserBodySchema,
  listRetailersQuerySchema,
} from "./users.validation";

const router = Router();

router.use(authenticate);

// POST /api/users/onboard
router.post(
  "/onboard",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ body: onboardUserBodySchema }),
  (req, res, next) => usersController.onboard(req, res, next),
);

// GET /api/users/dse
router.get("/dse", requireRoles(Role.ADMIN), (req, res, next) =>
  usersController.listDses(req, res, next),
);

// GET /api/users/retailers
router.get(
  "/retailers",
  requireRoles(Role.ADMIN, Role.DSE),
  validateRequest({ query: listRetailersQuerySchema }),
  (req, res, next) => usersController.listRetailers(req, res, next),
);

// GET /api/users/customers
router.get("/customers", requireRoles(Role.ADMIN, Role.DSE), (req, res, next) =>
  usersController.listCustomers(req, res, next),
);

export default router;
