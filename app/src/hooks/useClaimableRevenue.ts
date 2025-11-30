import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { investorApi } from '@/services/api';

export interface ClaimableEpoch {
  epochNumber: number;
  propertyMint: string;
  propertyName: string;
  totalRevenue: string;
  claimableAmount: string;
  depositedAt: string;
}

export interface ClaimableRevenueData {
  walletAddress: string;
  totalClaimable: string;
  epochs: ClaimableEpoch[];
}

export function useClaimableRevenue() {
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['claimable-revenue', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected');

      return investorApi.getClaimable(publicKey.toString());
    },
    enabled: !!publicKey,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
