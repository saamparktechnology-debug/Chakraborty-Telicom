export const CUSTOMERS_API_ENDPOINTS = {
  LIST: '/users/customers',
  ONBOARD: '/users/onboard',
  WALLET_TOPUP: '/customers',
  CONFIRM_DELIVERY: '/customers/deliveries/confirm',
  SEND_BILL: '/customers',
} as const;

export const LOW_WALLET_THRESHOLD_INR = 150.0;
