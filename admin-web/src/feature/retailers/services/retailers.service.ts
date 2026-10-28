import { apiRequest } from '@/lib/api';
import {
  RetailerShop,
  OnboardRetailerPayload,
  CollectDuePayload,
  LedgerPassbookEntry,
} from '../types/types';

export const retailersService = {
  async listRetailers(directOnly = false): Promise<RetailerShop[]> {
    const query = directOnly ? '?directOnly=true' : '';
    const res = await apiRequest<{ success: boolean; retailers: RetailerShop[] }>(
      `/users/retailers${query}`
    );
    return res.retailers;
  },

  async onboardRetailer(payload: OnboardRetailerPayload): Promise<RetailerShop> {
    const res = await apiRequest<{ success: boolean; user: RetailerShop }>('/users/onboard', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'RETAILER' }),
    });
    return { ...res.user, currentDue: '0.00' };
  },

  async collectStandaloneDue(payload: CollectDuePayload): Promise<{ currentDue: string }> {
    return await apiRequest<{ success: boolean; currentDue: string }>(
      '/retailer-orders/collect-due',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async getPassbook(retailerId: string): Promise<{
    currentDue: string;
    ledger: LedgerPassbookEntry[];
  }> {
    return await apiRequest<{
      success: boolean;
      currentDue: string;
      ledger: LedgerPassbookEntry[];
    }>(`/retailer-orders/retailer/${retailerId}`);
  },
};
