import { ProductUnitType } from '../types/types';

export const PRODUCTS_API_ENDPOINTS = {
  BASE: '/products',
} as const;

export const PRODUCT_CATEGORIES = ['ALL', 'Milk', 'Butter', 'Curd', 'Paneer', 'Beverage'] as const;

export const PRODUCT_UNIT_TYPES: ProductUnitType[] = ['Pouch', 'Crate', 'Box', 'Kg'];

export const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  Milk: 'bg-indigo-600',
  Butter: 'bg-amber-600',
  Curd: 'bg-emerald-600',
  Paneer: 'bg-purple-600',
  Beverage: 'bg-rose-600',
};
