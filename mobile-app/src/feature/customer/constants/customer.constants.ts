export const CUSTOMER_ENDPOINTS = {
  DASHBOARD: (customerId: string) => `/customers/${customerId}/dashboard`,
  TOGGLE_SKIP_DAY: "/customers/skip-days/toggle",
  TOGGLE_SKIP: "/customers/skip-days/toggle",
} as const;
