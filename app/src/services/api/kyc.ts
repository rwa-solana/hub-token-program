import { Connection, PublicKey } from '@solana/web3.js';
import { apiClient, ApiResponse } from './client';
import { KycVerification, CreateAttestationResult, CivicPassInfo } from '@/types';
import { getCivicPassStatus } from '@/utils/civic';
import { config } from '@/config';

export interface GatewayTokenPdaInfo {
  walletAddress: string;
  gatewayTokenPda: string;
  gatekeeperNetwork: string;
}

export interface CivicConfig {
  gatewayProgramId: string;
  gatekeeperNetwork: string;
  networkType: string;
  availableNetworks: {
    uniqueness: string;
    idVerification: string;
    captcha: string;
  };
  documentation: string;
}

export const kycApi = {
  /**
   * Verify Civic Pass status via backend API
   * Uses the backend to check Gateway Token status on-chain
   */
  verify: async (walletAddress: string): Promise<KycVerification> => {
    const response = await apiClient.get<any, ApiResponse<KycVerification>>(
      `/kyc/verify/${walletAddress}`
    );
    return response.data;
  },

  /**
   * Get Gateway Token PDA for a wallet
   */
  getGatewayTokenPda: async (walletAddress: string): Promise<GatewayTokenPdaInfo> => {
    const response = await apiClient.get<any, ApiResponse<GatewayTokenPdaInfo>>(
      `/kyc/gateway-token/${walletAddress}`
    );
    return response.data;
  },

  /**
   * Get Civic configuration info from backend
   */
  getConfig: async (): Promise<CivicConfig> => {
    const response = await apiClient.get<any, ApiResponse<CivicConfig>>(
      '/kyc/config'
    );
    return response.data;
  },

  /**
   * @deprecated Use Civic frontend to create Gateway Tokens
   * This endpoint only returns the expected Gateway Token PDA
   */
  createAttestation: async (walletAddress: string): Promise<CreateAttestationResult> => {
    const response = await apiClient.post<any, ApiResponse<CreateAttestationResult>>(
      '/kyc/attestation',
      { walletAddress }
    );
    return response.data;
  },

  /**
   * Verify Civic Pass status directly on-chain
   * This bypasses the backend and checks the Gateway Token directly
   */
  verifyCivicPass: async (walletAddress: string): Promise<CivicPassInfo> => {
    const connection = new Connection(config.solana.rpcUrl);
    const wallet = new PublicKey(walletAddress);

    const status = await getCivicPassStatus(connection, wallet);

    return {
      hasPass: status.hasPass,
      isActive: status.isActive,
      state: status.state,
      gatewayToken: status.gatewayToken?.toString() ?? null,
      expiresAt: status.expiresAt?.toISOString() ?? null,
      message: status.message,
    };
  },
};
