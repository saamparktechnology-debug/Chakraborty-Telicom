export interface RetailerShop {
  id: string;
  name: string;
  shopName: string | null;
  phone: string;
  address: string | null;
  assignedDseId: string | null;
  assignedDse?: { id: string; name: string; phone: string } | null;
  currentDue: string;
}

export interface LedgerPassbookEntry {
  id: string;
  entryType:
    | 'INVOICE_DEBIT'
    | 'PAYMENT_CASH_CREDIT'
    | 'PAYMENT_UPI_CREDIT'
    | 'MANUAL_ADJUSTMENT';
  amount: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface OnboardRetailerPayload {
  name: string;
  shopName: string;
  phone: string;
  address: string;
  assignedDseId: string | null;
}

export interface CollectDuePayload {
  retailerId: string;
  paidUpi: string;
  paidCash: string;
  notes: string;
}
