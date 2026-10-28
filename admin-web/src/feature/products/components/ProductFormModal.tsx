"use client";

import React, { useState, useEffect } from "react";
import {
  ProductItem,
  ProductUnitType,
  SaveProductPayload,
} from "../types/types";

interface Props {
  isOpen: boolean;
  editingProduct: ProductItem | null;
  onClose: () => void;
  onSave: (payload: SaveProductPayload) => void;
}

const GST_SLABS = [0, 5, 12, 18, 28];

export function ProductFormModal({
  isOpen,
  editingProduct,
  onClose,
  onSave,
}: Props) {
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Milk");
  const [unitType, setUnitType] = useState<ProductUnitType>("Pouch");
  const [unitsPerCrate, setUnitsPerCrate] = useState(24);
  const [retailerPrice, setRetailerPrice] = useState("31.50");
  const [customerPrice, setCustomerPrice] = useState("33.00");
  const [gstPercentage, setGstPercentage] = useState<number>(0);
  const [godownStockQty, setGodownStockQty] = useState<number>(240);
  const [isAvailable, setIsAvailable] = useState(true);

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [leftImageFile, setLeftImageFile] = useState<File | null>(null);
  const [rightImageFile, setRightImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setSkuCode(editingProduct.skuCode);
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setUnitType(editingProduct.unitType);
      setUnitsPerCrate(editingProduct.unitsPerCrate);
      setRetailerPrice(editingProduct.retailerPrice);
      setCustomerPrice(editingProduct.customerPrice);
      setGstPercentage(Number(editingProduct.gstPercentage ?? 0));
      setGodownStockQty(Number(editingProduct.godownStockQty ?? 0));
      setIsAvailable(editingProduct.isAvailable);
    } else {
      setSkuCode("AMUL-LASSI-200");
      setName("Amul Rose Lassi 200ml");
      setCategory("Beverage");
      setUnitType("Pouch");
      setUnitsPerCrate(30);
      setRetailerPrice("18.50");
      setCustomerPrice("20.00");
      setGstPercentage(5);
      setGodownStockQty(300);
      setIsAvailable(true);
    }
    setFrontImageFile(null);
    setBackImageFile(null);
    setLeftImageFile(null);
    setRightImageFile(null);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const enteredRetNum = parseFloat(retailerPrice || "0");
  const taxableRetPreview =
    gstPercentage > 0
      ? (enteredRetNum * 100) / (100 + gstPercentage)
      : enteredRetNum;
  const gstRetPreview = enteredRetNum - taxableRetPreview;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Product Palette, Multi-Angle Pictures &amp; Inclusive GST
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingProduct
                ? `Edit ${editingProduct.name}`
                : "+ Add Amul Product to Palette"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              skuCode,
              name,
              category,
              unitType,
              unitsPerCrate,
              retailerPrice,
              customerPrice,
              gstPercentage,
              godownStockQty,
              isAvailable,
              frontImageFile,
              backImageFile,
              leftImageFile,
              rightImageFile,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                {["Milk", "Butter", "Curd", "Paneer", "Beverage"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Unit Type</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as ProductUnitType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                {["Pouch", "Crate", "Box", "Kg"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Units Per Crate
              </label>
              <input
                type="number"
                min={1}
                required
                value={unitsPerCrate}
                onChange={(e) => setUnitsPerCrate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                B2B Retailer Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={retailerPrice}
                onChange={(e) => setRetailerPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                B2C Customer MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                GST Percentage (%)
              </label>
              <select
                value={gstPercentage}
                onChange={(e) => setGstPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-indigo-700"
              >
                {GST_SLABS.map((slab) => (
                  <option key={slab} value={slab}>
                    {slab}% GST
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Option B Inclusive GST Preview Banner */}
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div>
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                Option B Inclusive GST Rule ({gstPercentage}%):
              </span>{" "}
              <span className="text-indigo-700 dark:text-indigo-300">
                Base ₹{taxableRetPreview.toFixed(2)} + GST ₹
                {gstRetPreview.toFixed(2)} ={" "}
                <strong>₹{enteredRetNum.toFixed(2)}</strong> (If Non-GST
                selected at billing: ₹{enteredRetNum.toFixed(2)} with ₹0.00 GST)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">
                Main Amul Godown Stock (Units)
              </label>
              <input
                type="number"
                min={0}
                value={godownStockQty}
                onChange={(e) => setGodownStockQty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">
                = {Math.floor(godownStockQty / Math.max(1, unitsPerCrate))}{" "}
                Crates + {godownStockQty % Math.max(1, unitsPerCrate)} Loose{" "}
                {unitType}s
              </span>
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Product is Available for Indents &amp; Billing</span>
              </label>
            </div>
          </div>

          {/* 4-Side Multi-Angle Product Pictures Upload (/uploads/products via Multer) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              📷 Upload Product Pictures from All 4 Sides (Stored in{" "}
              <code className="font-mono text-indigo-600">
                /uploads/products
              </code>
              )
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  1. Front Side Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setFrontImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  2. Back Side Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setBackImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  3. Left Side Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setLeftImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  4. Right / Nutrition Side Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setRightImageFile(e.target.files?.[0] || null)
                  }
                  className="w-full text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Product &amp; Upload Pictures
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
