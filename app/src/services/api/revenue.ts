import { apiClient, ApiResponse } from './client';
import { RevenueHistory } from '@/types';

export const revenueApi = {
  getHistoryByProperty: async (mint: string): Promise<RevenueHistory> => {
    const response = await apiClient.get<any, ApiResponse<RevenueHistory>>(
      `/revenue/property/${mint}`
    );
    return response.data;
  },
};
