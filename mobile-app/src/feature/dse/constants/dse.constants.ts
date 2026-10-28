export const DSE_ENDPOINTS = {
  RETAILERS: "/users/retailers",
  CUSTOMERS: "/users/customers",
  PRODUCTS: "/products",
  ORDERS: "/retailer-orders",
  CREATE_INDENT: "/retailer-orders/indent",
  INSTANT_BILL: (orderId: string) => `/retailer-orders/${orderId}/instant-bill`,
  SPOT_BILL: "/retailer-orders/spot-bill",
  COLLECT_DUE: "/retailer-orders/collect-due",
  CONFIRM_CUSTOMER_DELIVERY: "/customers/deliveries/confirm",
  ONBOARD_USER: "/users/onboard",
  STOCK_OVERVIEW: "/stock/overview",
} as const;
