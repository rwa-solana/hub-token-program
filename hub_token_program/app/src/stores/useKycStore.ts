import { create } from 'zustand';
import { KycVerification } from '@/types';

interface KycState {
  verification: KycVerification | null;
  isLoading: boolean;
  error: string | null;
  setVerification: (verification: KycVerification) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useKycStore = create<KycState>((set) => ({
  verification: null,
  isLoading: false,
  error: null,
  setVerification: (verification) => set({ verification, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ verification: null, isLoading: false, error: null }),
}));
