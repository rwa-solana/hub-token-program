import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { investorApi } from '@/services/api';

export function usePortfolio() {
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['portfolio', publicKey?.toString()],
    queryFn: () => investorApi.getPortfolio(publicKey!.toString()),
    enabled: !!publicKey,
  });
}

export function useClaimableRevenue() {
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['claimable', publicKey?.toString()],
    queryFn: () => investorApi.getClaimable(publicKey!.toString()),
    enabled: !!publicKey,
  });
}
