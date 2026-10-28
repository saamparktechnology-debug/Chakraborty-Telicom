import { Router } from "express";
import { Role } from "@prisma/client";
import { productsController } from "./products.controller";
import { authenticate, requireRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { uploadProductImages } from "../../middlewares/upload.middleware";
import {
  createProductBodySchema,
  updateProductBodySchema,
  productIdParamSchema,
} from "./products.validation";

const router = Router();

router.use(authenticate);

// GET /api/products
router.get("/", (req, res, next) => productsController.list(req, res, next));

// POST /api/products (Admin only — supports multipart/form-data with 4 side images or application/json)
router.post(
  "/",
  requireRoles(Role.ADMIN),
  uploadProductImages,
  validateRequest({ body: createProductBodySchema }),
  (req, res, next) => productsController.create(req, res, next),
);

// PUT /api/products/:id (Admin only — supports multipart/form-data with 4 side images or application/json)
router.put(
  "/:id",
  requireRoles(Role.ADMIN),
  uploadProductImages,
  validateRequest({
    params: productIdParamSchema,
    body: updateProductBodySchema,
  }),
  (req, res, next) => productsController.update(req, res, next),
);

export default router;
