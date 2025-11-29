import { FC, ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  checkHubCredential,
  CredentialStatus,
  CredentialType,
  KycVerificationResult
} from '@/utils/kycVerification';

// Hub Credential API URL
const HUB_CREDENTIAL_API_URL = import.meta.env.VITE_HUB_CREDENTIAL_API_URL || 'http://localhost:3001';

export interface HubCredentialContextState {
  // Credential state
  credential: KycVerificationResult | null;
  isLoading: boolean;
  error: string | null;

  // Derived state
  hasCredential: boolean;
  isActive: boolean;
  credentialType: CredentialType | null;
  expiresAt: Date | null;

  // Actions
  refresh: () => Promise<void>;
  startKycSession: (type: CredentialType) => Promise<string | null>;
  submitKycData: (sessionId: string, data: Record<string, any>) => Promise<{ success: boolean; signature?: string }>;
  getSessionStatus: (sessionId: string) => Promise<any>;
}

const HubCredentialContext = createContext<HubCredentialContextState | null>(null);

export const useHubCredential = (): HubCredentialContextState => {
  const context = useContext(HubCredentialContext);
  if (!context) {
    throw new Error('useHubCredential must be used within HubCredentialProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const HubCredentialProvider: FC<Props> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [credential, setCredential] = useState<KycVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch credential status
  const refresh = useCallback(async () => {
    if (!publicKey || !connected) {
      setCredential(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkHubCredential(connection, publicKey);
      setCredential(result);
    } catch (err: any) {
      setError(err.message || 'Failed to check credential');
      setCredential(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Auto-refresh on wallet change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Start a new KYC session
  const startKycSession = useCallback(async (type: CredentialType): Promise<string | null> => {
    if (!publicKey) return null;

    try {
      console.log('Starting KYC session...', { type, wallet: publicKey.toString() });
      const response = await fetch(`${HUB_CREDENTIAL_API_URL}/api/kyc/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          credentialType: type,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create session:', response.status, errorText);
        throw new Error('Failed to create KYC session');
      }

      const data = await response.json();
      console.log('Session created:', data.sessionId);
      return data.sessionId;
    } catch (err: any) {
      console.error('Start KYC session error:', err);
      setError(err.message);
      return null;
    }
  }, [publicKey]);

  // Submit KYC data
  const submitKycData = useCallback(async (sessionId: string, data: Record<string, any>): Promise<{ success: boolean; signature?: string }> => {
    try {
      console.log('Submitting KYC data...', { sessionId, data });

      // Update session data
      const updateResponse = await fetch(`${HUB_CREDENTIAL_API_URL}/api/kyc/session/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update session:', updateResponse.status, errorText);
        throw new Error('Failed to update KYC data');
      }

      console.log('Session data updated, submitting for verification...');

      // Submit for verification
      const submitResponse = await fetch(`${HUB_CREDENTIAL_API_URL}/api/kyc/session/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Failed to submit:', submitResponse.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Verification failed' };
        }
        throw new Error(errorData.error || 'Verification failed');
      }

      const result = await submitResponse.json();
      console.log('Verification result:', result);

      // Extract transaction signature
      const signature = result.verificationResult?.credentialSignature;

      // Refresh credential after successful verification
      if (result.status === 'completed') {
        console.log('Verification completed, refreshing credential...');
        await refresh();
        return { success: true, signature };
      }

      console.warn('Verification not completed:', result.status);
      return { success: false };
    } catch (err: any) {
      console.error('Submit KYC data error:', err);
      setError(err.message);
      return { success: false };
    }
  }, [refresh]);

  // Get session status
  const getSessionStatus = useCallback(async (sessionId: string): Promise<any> => {
    try {
      const response = await fetch(`${HUB_CREDENTIAL_API_URL}/api/kyc/session/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to get session status');
      }
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Derived state
  const hasCredential = credential?.status !== CredentialStatus.NotFound;
  const isActive = credential?.isValid === true && credential?.status === CredentialStatus.Active;
  const credentialType = credential?.credentialType || null;
  const expiresAt = credential?.expiresAt || null;

  const value: HubCredentialContextState = {
    credential,
    isLoading,
    error,
    hasCredential,
    isActive,
    credentialType,
    expiresAt,
    refresh,
    startKycSession,
    submitKycData,
    getSessionStatus,
  };

  return (
    <HubCredentialContext.Provider value={value}>
      {children}
    </HubCredentialContext.Provider>
  );
};
