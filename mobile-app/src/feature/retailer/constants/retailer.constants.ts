export const RETAILER_ENDPOINTS = {
  PRODUCTS: "/products",
  RETAILERS: "/users/retailers",
  RETAILER_ORDERS: "/retailer-orders",
  RETAILER_LEDGER: (retailerId: string) =>
    `/retailer-orders/retailer/${retailerId}`,
  PASSBOOK: (retailerId: string) => `/retailer-orders/retailer/${retailerId}`,
} as const;
