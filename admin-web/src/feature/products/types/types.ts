export type ProductUnitType = "Pouch" | "Crate" | "Box" | "Kg";

export interface ProductItem {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  unitType: ProductUnitType;
  unitsPerCrate: number;
  retailerPrice: string;
  customerPrice: string;
  gstPercentage: number;
  godownStockQty: number;
  imageUrl?: string | null;
  imageFrontUrl?: string | null;
  imageBackUrl?: string | null;
  imageLeftUrl?: string | null;
  imageRightUrl?: string | null;
  isAvailable: boolean;
}

export interface SaveProductPayload {
  skuCode: string;
  name: string;
  category: string;
  unitType: ProductUnitType;
  unitsPerCrate: number;
  retailerPrice: string;
  customerPrice: string;
  gstPercentage: number;
  godownStockQty?: number;
  isAvailable: boolean;
  frontImageFile?: File | null;
  backImageFile?: File | null;
  leftImageFile?: File | null;
  rightImageFile?: File | null;
}
