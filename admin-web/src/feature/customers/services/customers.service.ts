import { apiRequest } from '@/lib/api';
import { CustomerRecord } from '../types/types';

interface BackendCustomerItem {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  assignedDse?: { id: string; name: string; phone: string } | null;
  walletBalance: string;
  subscriptions: Array<{
    id: string;
    productId: string;
    dailyQty: number;
    status: string;
    product: { id: string; name: string; customerPrice: string };
  }>;
  skipDays: Array<{ id: string; skipDate: string; reason: string | null }>;
}

export const customersService = {
  async listCustomers(): Promise<CustomerRecord[]> {
    const res = await apiRequest<{ success: boolean; customers: BackendCustomerItem[] }>(
      '/users/customers'
    );
    return res.customers.map((c) => {
      const sub = c.subscriptions[0];
      const dailyDeduction = sub
        ? (parseFloat(sub.product.customerPrice) * sub.dailyQty).toFixed(2)
        : '0.00';
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        assignedDseName: c.assignedDse ? c.assignedDse.name : 'Direct Admin',
        walletBalance: c.walletBalance,
        subscriptionSummary: sub
          ? `${sub.product.name} × ${sub.dailyQty} pouches/day (₹${dailyDeduction}/day)`
          : 'No active subscription',
        dailyDeductionAmount: dailyDeduction,
        productId: sub ? sub.productId : '',
        dailyQty: sub ? sub.dailyQty : 1,
        skippedDates: c.skipDays.map((s) => String(s.skipDate).slice(0, 10)),
      };
    });
  },

  async topUpWallet(customerId: string, amount: string, notes: string) {
    return await apiRequest<{ success: boolean; walletBalance: string }>(
      `/customers/${customerId}/wallet-topup`,
      {
        method: 'POST',
        body: JSON.stringify({ amount, notes }),
      }
    );
  },

  async confirmDailyDelivery(payload: {
    customerId: string;
    productId: string;
    deliveryDate: string;
    deliveredQty: number;
  }) {
    return await apiRequest<{ success: boolean; walletBalanceAfter: string }>(
      '/customers/deliveries/confirm',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async sendPeriodicBill(customerId: string, periodStart: string, periodEnd: string) {
    return await apiRequest<{
      success: boolean;
      bill: {
        billNumber: string;
        deliveriesAmount: string;
        topupsAmount: string;
        closingBalance: string;
      };
    }>(`/customers/${customerId}/send-bill`, {
      method: 'POST',
      body: JSON.stringify({ periodStart, periodEnd }),
    });
  },
};
