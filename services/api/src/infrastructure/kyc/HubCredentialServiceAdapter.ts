import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../config/Config';
import {
  IKycService,
  KycVerificationResult,
  CreateAttestationParams,
  GatewayTokenState,
} from '../../application/ports/IKycService';

/**
 * Hub Credential KYC Service Adapter
 *
 * This service integrates with the Hub Credential Protocol for identity verification.
 * It replaces Civic Gateway with our custom on-chain credential system.
 *
 * Hub Credential API: http://localhost:3001
 * Program ID: FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
 */
@injectable()
export class HubCredentialServiceAdapter implements IKycService {
  private hubCredentialApiUrl: string;

  constructor(@inject(TOKENS.Config) private config: Config) {
    // Hub Credential API URL from config
    this.hubCredentialApiUrl = config.hubCredential.apiUrl;
  }

  /**
   * Verify if a wallet has a valid Hub Credential
   */
  async verifyKyc(walletAddress: string): Promise<KycVerificationResult> {
    try {
      // Call Hub Credential API to verify the credential
      const response = await axios.post(`${this.hubCredentialApiUrl}/api/credentials/verify`, {
        userWallet: walletAddress,
      });

      const data = response.data;

      if (!data.success) {
        return {
          isValid: false,
          status: 'pending',
          gatewayToken: null,
          gatewayTokenState: null,
          expiresAt: null,
          message: data.reason || 'Verification failed',
        };
      }

      if (!data.isValid) {
        // Map credential status to KYC status
        const status = this.mapCredentialStatusToKycStatus(data.reason, data.credential?.status);

        return {
          isValid: false,
          status,
          gatewayToken: data.credential?.publicKey || null,
          gatewayTokenState: this.mapCredentialStatusToGatewayState(data.credential?.status),
          expiresAt: data.credential?.expiresAt ? new Date(data.credential.expiresAt * 1000) : null,
          message: data.reason || 'Credential not valid',
        };
      }

      // Valid credential found
      return {
        isValid: true,
        status: 'verified',
        gatewayToken: data.credential.publicKey,
        gatewayTokenState: 'ACTIVE',
        expiresAt: data.credential.expiresAt ? new Date(data.credential.expiresAt * 1000) : null,
        message: 'Identity verified. You can transfer tokens.',
      };
    } catch (error: any) {
      // Check if it's a 404 (no credential found)
      if (error.response?.status === 404) {
        return {
          isValid: false,
          status: 'pending',
          gatewayToken: null,
          gatewayTokenState: null,
          expiresAt: null,
          message: 'No Hub Credential found. Please complete identity verification.',
        };
      }

      console.error('[HubCredential] Verification error:', error.message);
      return {
        isValid: false,
        status: 'pending',
        gatewayToken: null,
        gatewayTokenState: null,
        expiresAt: null,
        message: `Verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Get the credential PDA for a wallet
   * Hub Credential uses: ['credential', holder.toBuffer()]
   */
  getGatewayTokenPda(walletAddress: string): string {
    // For Hub Credential, we derive the PDA using the credential program
    // This would require the program ID and seed derivation
    // For now, return a placeholder - the actual PDA is returned from the API
    return `credential:${walletAddress}`;
  }

  /**
   * Check if a valid Hub Credential exists for a wallet
   */
  async hasValidCivicPass(walletAddress: string): Promise<boolean> {
    const result = await this.verifyKyc(walletAddress);
    return result.isValid;
  }

  /**
   * Create attestation is not supported in Hub Credential mode
   * Credentials are issued through the Hub Credential API
   */
  async createAttestation(params: CreateAttestationParams): Promise<{
    attestationAccount: string;
    signature: string;
  }> {
    throw new Error(
      'Direct attestation creation not supported. Use Hub Credential API to issue credentials.'
    );
  }

  /**
   * Map Hub Credential status to KYC status
   */
  private mapCredentialStatusToKycStatus(
    reason: string | undefined,
    credentialStatus: string | undefined
  ): 'pending' | 'verified' | 'rejected' | 'expired' {
    if (!credentialStatus) return 'pending';

    switch (credentialStatus) {
      case 'active':
        return 'verified';
      case 'expired':
        return 'expired';
      case 'revoked':
      case 'suspended':
        return 'rejected';
      default:
        if (reason?.includes('expired')) return 'expired';
        if (reason?.includes('No credential')) return 'pending';
        return 'pending';
    }
  }

  /**
   * Map Hub Credential status to Gateway Token State (for compatibility)
   */
  private mapCredentialStatusToGatewayState(
    credentialStatus: string | undefined
  ): GatewayTokenState | null {
    if (!credentialStatus) return null;

    switch (credentialStatus) {
      case 'active':
        return 'ACTIVE';
      case 'suspended':
        return 'FROZEN';
      case 'revoked':
        return 'REVOKED';
      default:
        return null;
    }
  }
}
