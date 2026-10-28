export const INDENTS_BILLING_API_ENDPOINTS = {
  ORDERS: '/retailer-orders',
  INDENT: '/retailer-orders/indent',
  SPOT_BILL: '/retailer-orders/spot-bill',
  RETAILERS: '/users/retailers',
  PRODUCTS: '/products',
} as const;

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Order Statuses' },
  { value: 'INDENTED', label: 'INDENTED (Next-Day Orders)' },
  { value: 'OUT_FOR_DELIVERY', label: 'OUT_FOR_DELIVERY' },
  { value: 'DELIVERED', label: 'DELIVERED (Billed & Posted)' },
  { value: 'CANCELLED', label: 'CANCELLED' },
] as const;

export const ORDER_STATUS_BADGE_CLASSES: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  INDENTED: 'bg-amber-100 text-amber-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};
