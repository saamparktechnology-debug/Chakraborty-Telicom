"use client";

import React from "react";
import { useProducts } from "./hooks/useProducts";
import { ProductPaletteGrid } from "./components/ProductPaletteGrid";
import { ProductFormModal } from "./components/ProductFormModal";
import { formatInr } from "@/lib/export-utils";
import { API_BASE_URL } from "@/lib/api";

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveUploadUrl(relPath?: string | null): string | null {
  if (!relPath) return null;
  if (relPath.startsWith("http://") || relPath.startsWith("https://"))
    return relPath;
  return `${BACKEND_ORIGIN}${relPath.startsWith("/") ? "" : "/"}${relPath}`;
}

export function ProductsFeature() {
  const {
    products,
    allProductsCount,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    loading,
    error,
    feedback,
    modalOpen,
    editingProduct,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveProduct,
    handleToggleAvailability,
    refreshProducts,
  } = useProducts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            /products • Multi-Angle Pictures, Inclusive GST &amp; Godown Stock
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            Product Palette Manager ({allProductsCount} SKUs)
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "GRID"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              4-Side Card Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "TABLE"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Product Table View
            </button>
          </div>

          <button
            type="button"
            onClick={refreshProducts}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ↻ Refresh API
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            + Add Product &amp; Upload 4-Side Pictures
          </button>
        </div>
      </div>

      {/* Feedback & Error Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU code or product name..."
              className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 w-64"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value="Milk">Milk</option>
              <option value="Butter">Butter</option>
              <option value="Curd">Curd</option>
              <option value="Paneer">Paneer</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>
          <span className="text-xs text-slate-500">
            Showing <strong>{products.length}</strong> of {allProductsCount}{" "}
            products
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-500">
            Fetching Amul Product Palette &amp; Multi-Angle Pictures from{" "}
            <code className="font-mono">GET /api/products</code>...
          </div>
        ) : viewMode === "GRID" ? (
          <ProductPaletteGrid
            products={products}
            onEdit={openEditModal}
            onToggleAvailability={handleToggleAvailability}
          />
        ) : (
          /* Product Table View with All 4-Side Pictures */
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                  <th className="py-2.5 px-3">4-Side Product Pictures</th>
                  <th className="py-2.5 px-3">SKU &amp; Product Name</th>
                  <th className="py-2.5 px-3">Unit / Crate</th>
                  <th className="py-2.5 px-3 text-right">B2B Price</th>
                  <th className="py-2.5 px-3 text-right">B2C MRP</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">Godown Stock</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => {
                  const sides = [
                    {
                      label: "F",
                      url: resolveUploadUrl(p.imageFrontUrl || p.imageUrl),
                    },
                    { label: "B", url: resolveUploadUrl(p.imageBackUrl) },
                    { label: "L", url: resolveUploadUrl(p.imageLeftUrl) },
                    { label: "R", url: resolveUploadUrl(p.imageRightUrl) },
                  ];
                  const crates = Math.floor(
                    (p.godownStockQty || 0) / Math.max(1, p.unitsPerCrate),
                  );
                  const loose =
                    (p.godownStockQty || 0) % Math.max(1, p.unitsPerCrate);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {sides.map((s) => (
                            <div
                              key={s.label}
                              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0"
                              title={`Side: ${s.label}`}
                            >
                              {s.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.url}
                                  alt={`${p.name} ${s.label}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-[9px] font-mono text-slate-400">
                                  {s.label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] font-bold text-indigo-600">
                          {p.skuCode}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.category}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {p.unitType} ({p.unitsPerCrate}/crate)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatInr(p.retailerPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                        {formatInr(p.customerPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {Number(p.gstPercentage ?? 0)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {p.godownStockQty ?? 0} ({crates}C + {loose}L)
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold"
                        >
                          Edit / Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(p)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold"
                        >
                          {p.isAvailable ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={modalOpen}
        editingProduct={editingProduct}
        onClose={closeModal}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

export default ProductsFeature;
