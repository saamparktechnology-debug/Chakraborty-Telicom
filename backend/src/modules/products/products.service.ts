import { ProductUnitType } from "@prisma/client";
import { prisma } from "../../config/database";
import { Money } from "../../config/money";
import { AppError } from "../../middlewares/error.middleware";

export interface ProductImagePaths {
  imageFrontUrl?: string;
  imageBackUrl?: string;
  imageLeftUrl?: string;
  imageRightUrl?: string;
}

export class ProductsService {
  private serializeProduct(p: {
    id: string;
    skuCode: string;
    name: string;
    category: string;
    unitType: ProductUnitType;
    unitsPerCrate: number;
    retailerPrice: { toString(): string };
    customerPrice: { toString(): string };
    gstPercentage?: { toString(): string } | null;
    godownStockQty?: number;
    imageUrl?: string | null;
    imageFrontUrl?: string | null;
    imageBackUrl?: string | null;
    imageLeftUrl?: string | null;
    imageRightUrl?: string | null;
    isAvailable: boolean;
  }) {
    const primaryImage =
      p.imageFrontUrl ||
      p.imageUrl ||
      p.imageBackUrl ||
      p.imageLeftUrl ||
      p.imageRightUrl ||
      null;

    return {
      id: p.id,
      skuCode: p.skuCode,
      name: p.name,
      category: p.category,
      unitType: p.unitType,
      unitsPerCrate: p.unitsPerCrate,
      retailerPrice: p.retailerPrice.toString(),
      customerPrice: p.customerPrice.toString(),
      gstPercentage: p.gstPercentage ? Number(p.gstPercentage.toString()) : 0,
      godownStockQty: p.godownStockQty ?? 0,
      imageUrl: primaryImage,
      imageFrontUrl: p.imageFrontUrl || null,
      imageBackUrl: p.imageBackUrl || null,
      imageLeftUrl: p.imageLeftUrl || null,
      imageRightUrl: p.imageRightUrl || null,
      isAvailable: p.isAvailable,
    };
  }

  async listProducts(includeUnavailable = true) {
    const products = await prisma.product.findMany({
      where: includeUnavailable ? {} : { isAvailable: true },
      orderBy: { name: "asc" },
    });
    return products.map((p) => this.serializeProduct(p));
  }

  async createProduct(
    input: {
      skuCode: string;
      name: string;
      category: string;
      unitType: ProductUnitType;
      unitsPerCrate: number;
      retailerPrice: string | number;
      customerPrice: string | number;
      gstPercentage?: number;
      godownStockQty?: number;
      isAvailable?: boolean;
    },
    images?: ProductImagePaths,
  ) {
    const existing = await prisma.product.findUnique({
      where: { skuCode: input.skuCode },
    });
    if (existing) {
      throw new AppError(
        409,
        "DUPLICATE_SKU",
        `Product with SKU '${input.skuCode}' already exists.`,
      );
    }

    const retailerPriceStr = Money.toDecimalString(
      Money.toPaise(input.retailerPrice),
    );
    const customerPriceStr = Money.toDecimalString(
      Money.toPaise(input.customerPrice),
    );
    const gstPct = Number(input.gstPercentage ?? 0);

    const created = await prisma.product.create({
      data: {
        skuCode: input.skuCode.trim(),
        name: input.name.trim(),
        category: input.category.trim(),
        unitType: input.unitType,
        unitsPerCrate: Number(input.unitsPerCrate || 24),
        retailerPrice: retailerPriceStr,
        customerPrice: customerPriceStr,
        gstPercentage: gstPct.toFixed(2),
        godownStockQty: Math.max(0, Number(input.godownStockQty ?? 0)),
        imageUrl: images?.imageFrontUrl || null,
        imageFrontUrl: images?.imageFrontUrl || null,
        imageBackUrl: images?.imageBackUrl || null,
        imageLeftUrl: images?.imageLeftUrl || null,
        imageRightUrl: images?.imageRightUrl || null,
        isAvailable: input.isAvailable ?? true,
      },
    });

    return this.serializeProduct(created);
  }

  async updateProduct(
    productId: string,
    input: Partial<{
      skuCode: string;
      name: string;
      category: string;
      unitType: ProductUnitType;
      unitsPerCrate: number;
      retailerPrice: string | number;
      customerPrice: string | number;
      gstPercentage: number;
      godownStockQty: number;
      isAvailable: boolean;
    }>,
    images?: ProductImagePaths,
  ) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    const data: Record<string, unknown> = {};
    if (input.skuCode !== undefined) data.skuCode = input.skuCode.trim();
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.unitType !== undefined) data.unitType = input.unitType;
    if (input.unitsPerCrate !== undefined)
      data.unitsPerCrate = Number(input.unitsPerCrate);
    if (input.retailerPrice !== undefined) {
      data.retailerPrice = Money.toDecimalString(
        Money.toPaise(input.retailerPrice),
      );
    }
    if (input.customerPrice !== undefined) {
      data.customerPrice = Money.toDecimalString(
        Money.toPaise(input.customerPrice),
      );
    }
    if (input.gstPercentage !== undefined) {
      data.gstPercentage = Number(input.gstPercentage).toFixed(2);
    }
    if (input.godownStockQty !== undefined) {
      data.godownStockQty = Math.max(0, Number(input.godownStockQty));
    }
    if (input.isAvailable !== undefined) {
      data.isAvailable = Boolean(input.isAvailable);
    }

    if (images?.imageFrontUrl) {
      data.imageFrontUrl = images.imageFrontUrl;
      data.imageUrl = images.imageFrontUrl;
    }
    if (images?.imageBackUrl) data.imageBackUrl = images.imageBackUrl;
    if (images?.imageLeftUrl) data.imageLeftUrl = images.imageLeftUrl;
    if (images?.imageRightUrl) data.imageRightUrl = images.imageRightUrl;

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    });

    return this.serializeProduct(updated);
  }
}

export const productsService = new ProductsService();
