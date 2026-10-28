export const OVERVIEW_API_ENDPOINTS = {
  OVERVIEW: '/analytics/overview',
  COLLECT_DUE: '/retailer-orders/collect-due',
} as const;

export const OVERVIEW_CHART_COLORS = {
  b2bSales: '#4f46e5',
  b2cWallet: '#059669',
  totalCollected: '#0284c7',
  upi: '#4f46e5',
  cash: '#10b981',
  billed: '#f59e0b',
} as const;

export const CATEGORY_PIE_COLORS: Record<string, string> = {
  Milk: '#4f46e5',
  Butter: '#d97706',
  Paneer: '#7c3aed',
  Curd: '#059669',
  Beverage: '#e11d48',
};

export const LEDGER_ENTRY_BADGE_MAP: Record<string, string> = {
  INVOICE_DEBIT: 'bg-rose-100 text-rose-800 border-rose-200',
  PAYMENT_UPI_CREDIT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PAYMENT_CASH_CREDIT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  WALLET_TOPUP_CREDIT: 'bg-teal-100 text-teal-800 border-teal-200',
  DAILY_DELIVERY_DEBIT: 'bg-amber-100 text-amber-800 border-amber-200',
};
