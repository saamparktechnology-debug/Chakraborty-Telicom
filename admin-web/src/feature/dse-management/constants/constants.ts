export const DSE_API_ENDPOINTS = {
  LIST: '/users/dse',
  ONBOARD: '/users/onboard',
} as const;

export const DSE_TABLE_COLUMNS = [
  'Executive Name',
  'Phone (Login ID)',
  'Beat / Route Area',
  'Assigned Retailers',
  'Assigned Customers',
  'Pending Indents',
  'Today Cash-in-Hand',
  'Today UPI Settled',
  'Today Total Billed',
] as const;
