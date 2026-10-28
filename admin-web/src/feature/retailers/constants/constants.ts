export const RETAILERS_API_ENDPOINTS = {
  LIST: '/users/retailers',
  ONBOARD: '/users/onboard',
  COLLECT_DUE: '/retailer-orders/collect-due',
  PASSBOOK: '/retailer-orders/retailer',
  DSES: '/users/dse',
} as const;

export const RETAILER_TABS = [
  { id: 'ALL', label: 'All Retailers' },
  { id: 'DIRECT', label: 'Direct Retailers (Without DSE)' },
] as const;

export const PASSBOOK_ENTRY_BADGE_STYLES: Record<string, string> = {
  INVOICE_DEBIT: 'bg-rose-100 text-rose-800',
  PAYMENT_UPI_CREDIT: 'bg-indigo-100 text-indigo-800',
  PAYMENT_CASH_CREDIT: 'bg-emerald-100 text-emerald-800',
  MANUAL_ADJUSTMENT: 'bg-amber-100 text-amber-800',
};
