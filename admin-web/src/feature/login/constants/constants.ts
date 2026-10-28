export const LOGIN_API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
} as const;

export const ROLE_HOME_ROUTES = {
  ADMIN: '/overview',
  DSE: '/indents-billing',
  RETAILER: '/retailers',
  CUSTOMER: '/customers',
} as const;
