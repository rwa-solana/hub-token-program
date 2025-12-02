import { apiClient, ApiResponse } from './client';
import { Portfolio, ClaimableRevenue } from '@/types';

export const investorApi = {
  getPortfolio: async (walletAddress: string): Promise<Portfolio> => {
    const response = await apiClient.get<any, ApiResponse<Portfolio>>(
      `/investors/${walletAddress}/portfolio`
    );
    return response.data;
  },

  getClaimable: async (walletAddress: string): Promise<ClaimableRevenue> => {
    const response = await apiClient.get<any, ApiResponse<ClaimableRevenue>>(
      `/investors/${walletAddress}/claimable`
    );
    return response.data;
  },
};
