import { API_BASE_URL, apiRequest } from "@/lib/api";
import { ProductItem, SaveProductPayload } from "../types/types";

function buildProductFormData(payload: Partial<SaveProductPayload>): FormData {
  const fd = new FormData();
  if (payload.skuCode !== undefined) fd.append("skuCode", payload.skuCode);
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.category !== undefined) fd.append("category", payload.category);
  if (payload.unitType !== undefined) fd.append("unitType", payload.unitType);
  if (payload.unitsPerCrate !== undefined)
    fd.append("unitsPerCrate", String(payload.unitsPerCrate));
  if (payload.retailerPrice !== undefined)
    fd.append("retailerPrice", String(payload.retailerPrice));
  if (payload.customerPrice !== undefined)
    fd.append("customerPrice", String(payload.customerPrice));
  if (payload.gstPercentage !== undefined)
    fd.append("gstPercentage", String(payload.gstPercentage));
  if (payload.godownStockQty !== undefined)
    fd.append("godownStockQty", String(payload.godownStockQty));
  if (payload.isAvailable !== undefined)
    fd.append("isAvailable", String(payload.isAvailable));

  if (payload.frontImageFile) fd.append("frontImage", payload.frontImageFile);
  if (payload.backImageFile) fd.append("backImage", payload.backImageFile);
  if (payload.leftImageFile) fd.append("leftImage", payload.leftImageFile);
  if (payload.rightImageFile) fd.append("rightImage", payload.rightImageFile);
  return fd;
}

async function sendMultipartProductRequest(
  endpoint: string,
  method: "POST" | "PUT",
  fd: FormData,
): Promise<ProductItem> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("amul_access_token")
      : null;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: fd,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Product upload failed (${res.status})`);
  }
  return data.product as ProductItem;
}

export const productsService = {
  async listProducts(): Promise<ProductItem[]> {
    const res = await apiRequest<{ products: ProductItem[] }>("/products");
    return res.products || [];
  },

  async createProduct(payload: SaveProductPayload): Promise<ProductItem> {
    const fd = buildProductFormData(payload);
    return await sendMultipartProductRequest("/products", "POST", fd);
  },

  async updateProduct(
    id: string,
    payload: Partial<SaveProductPayload>,
  ): Promise<ProductItem> {
    const hasFiles =
      payload.frontImageFile ||
      payload.backImageFile ||
      payload.leftImageFile ||
      payload.rightImageFile;

    if (hasFiles) {
      const fd = buildProductFormData(payload);
      return await sendMultipartProductRequest(`/products/${id}`, "PUT", fd);
    }

    const res = await apiRequest<{ product: ProductItem }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.product;
  },
};
