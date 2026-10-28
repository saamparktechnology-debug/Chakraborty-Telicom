import { Request, Response, NextFunction } from "express";
import { productsService, ProductImagePaths } from "./products.service";

function extractUploadedImages(req: Request): ProductImagePaths {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const result: ProductImagePaths = {};
  if (!files) return result;

  if (files.frontImage?.[0]) {
    result.imageFrontUrl = `/uploads/products/${files.frontImage[0].filename}`;
  }
  if (files.backImage?.[0]) {
    result.imageBackUrl = `/uploads/products/${files.backImage[0].filename}`;
  }
  if (files.leftImage?.[0]) {
    result.imageLeftUrl = `/uploads/products/${files.leftImage[0].filename}`;
  }
  if (files.rightImage?.[0]) {
    result.imageRightUrl = `/uploads/products/${files.rightImage[0].filename}`;
  }
  return result;
}

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeUnavailable = req.user?.role === "ADMIN";
      const products = await productsService.listProducts(includeUnavailable);
      res.status(200).json({ success: true, products });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const images = extractUploadedImages(req);
      const product = await productsService.createProduct(req.body, images);
      res.status(201).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const images = extractUploadedImages(req);
      const product = await productsService.updateProduct(
        req.params.id,
        req.body,
        images,
      );
      res.status(200).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
