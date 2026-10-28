"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { productsService } from "../services/products.service";
import { ProductItem, SaveProductPayload } from "../types/types";

export function useProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null,
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await productsService.listProducts();
      setProducts(list);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products from backend API.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.skuCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "ALL" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (payload: SaveProductPayload) => {
    setError(null);
    setFeedback(null);
    try {
      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, payload);
        setFeedback(
          `Updated "${payload.name}" (${payload.skuCode}) with GST ${payload.gstPercentage}% and pictures.`,
        );
      } else {
        await productsService.createProduct(payload);
        setFeedback(
          `Added "${payload.name}" (${payload.skuCode}) to Product Palette.`,
        );
      }
      closeModal();
      await fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    }
  };

  const handleToggleAvailability = async (product: ProductItem) => {
    setError(null);
    setFeedback(null);
    try {
      await productsService.updateProduct(product.id, {
        isAvailable: !product.isAvailable,
      });
      setFeedback(
        `${product.name} marked as ${!product.isAvailable ? "Available" : "Unavailable"}.`,
      );
      await fetchProducts();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product availability.",
      );
    }
  };

  return {
    products: filteredProducts,
    allProductsCount: products.length,
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
    refreshProducts: fetchProducts,
  };
}
