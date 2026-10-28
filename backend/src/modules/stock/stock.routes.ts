import { Router } from "express";
import { Role } from "@prisma/client";
import { stockController } from "./stock.controller";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  amulInwardStockBodySchema,
  allocateToDseBodySchema,
  returnFromDseBodySchema,
} from "./stock.validation";

const router = Router();

router.use(authenticate);

// GET /api/stock/overview (Admin sees Godown + all DSEs; DSE sees own live vehicle stock)
router.get("/overview", requireRoles(Role.ADMIN, Role.DSE), (req, res, next) =>
  stockController.getOverview(req, res, next),
);

// POST /api/stock/inward (Admin adds stock received from AMUL Dairy)
router.post(
  "/inward",
  requireRoles(Role.ADMIN),
  validateRequest({ body: amulInwardStockBodySchema }),
  (req, res, next) => stockController.addInward(req, res, next),
);

// POST /api/stock/allocate (Admin allocates Godown stock to DSE vehicle)
router.post(
  "/allocate",
  requireRoles(Role.ADMIN),
  validateRequest({ body: allocateToDseBodySchema }),
  (req, res, next) => stockController.allocateToDse(req, res, next),
);

// POST /api/stock/return (Admin records EOD unsold stock return from DSE back to Godown)
router.post(
  "/return",
  requireRoles(Role.ADMIN),
  validateRequest({ body: returnFromDseBodySchema }),
  (req, res, next) => stockController.returnFromDse(req, res, next),
);

export default router;
