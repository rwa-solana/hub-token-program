import { KycStatus } from '../../domain/entities';
/**
 * Gateway Token State from Civic
 */
export type GatewayTokenState = 'ACTIVE' | 'FROZEN' | 'REVOKED';
/**
 * KYC Verification Result
 * Represents the result of verifying a wallet's Civic Pass
 */
export interface KycVerificationResult {
    isValid: boolean;
    status: KycStatus;
    gatewayToken: string | null;
    gatewayTokenState: GatewayTokenState | null;
    expiresAt: Date | null;
    message: string;
}
/**
 * @deprecated Use Civic Pass directly in the frontend
 */
export interface CreateAttestationParams {
    walletAddress: string;
    provider?: string;
    expiresInDays?: number;
}
export interface IKycService {
    /**
     * Verify if a wallet has valid Civic Pass (Gateway Token)
     */
    verifyKyc(walletAddress: string): Promise<KycVerificationResult>;
    /**
     * Create a mock attestation (for testing/devnet only)
     * @deprecated In production, users should complete KYC through Civic
     */
    createAttestation(params: CreateAttestationParams): Promise<{
        attestationAccount: string;
        signature: string;
    }>;
    /**
     * Derive the Gateway Token PDA for a wallet
     */
    getGatewayTokenPda(walletAddress: string): string;
    /**
     * Check if a valid Civic Pass exists for a wallet
     */
    hasValidCivicPass(walletAddress: string): Promise<boolean>;
}
//# sourceMappingURL=IKycService.d.ts.map