import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { kycApi } from '@/services/api';
import toast from 'react-hot-toast';

export function useKycVerification() {
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ['kyc', publicKey?.toString()],
    queryFn: () => kycApi.verify(publicKey!.toString()),
    enabled: !!publicKey,
  });
}

export function useCreateAttestation() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => kycApi.createAttestation(publicKey!.toString()),
    onSuccess: () => {
      toast.success('KYC attestation created successfully!');
      queryClient.invalidateQueries({ queryKey: ['kyc', publicKey?.toString()] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create attestation');
    },
  });
}
