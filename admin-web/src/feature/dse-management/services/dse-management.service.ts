import { apiRequest } from '@/lib/api';
import { CreateDsePayload, DseExecutive } from '../types/types';

export const dseManagementService = {
  async getDseList(): Promise<DseExecutive[]> {
    const res = await apiRequest<{ success: boolean; dses: DseExecutive[] }>('/users/dse');
    return res.dses;
  },

  async createDse(payload: CreateDsePayload): Promise<{ id: string; name: string; phone: string }> {
    const res = await apiRequest<{
      success: boolean;
      user: { id: string; name: string; phone: string };
    }>('/users/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.user;
  },
};
