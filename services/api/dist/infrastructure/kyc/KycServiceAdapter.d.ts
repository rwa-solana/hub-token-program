import { Config } from '../config/Config';
import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import { IKycService, KycVerificationResult, CreateAttestationParams } from '../../application/ports/IKycService';
/**
 * KYC Service Adapter - Integrates with Civic Gateway Protocol
 *
 * This service verifies Civic Pass (Gateway Token) status for wallets.
 * Civic Pass provides identity verification (KYC/AML) on Solana.
 *
 * Documentation: https://docs.civic.com
 */
export declare class KycServiceAdapter implements IKycService {
    private config;
    private solanaConnection;
    private gatewayProgram;
    private gatekeeperNetwork;
    constructor(config: Config, solanaConnection: SolanaConnectionAdapter);
    /**
     * Verify if a wallet has a valid Civic Pass
     */
    verifyKyc(walletAddress: string): Promise<KycVerificationResult>;
    /**
     * Create a mock attestation (devnet only)
     * @deprecated In production, users should complete KYC through Civic
     */
    createAttestation(params: CreateAttestationParams): Promise<{
        attestationAccount: string;
        signature: string;
    }>;
    /**
     * Derive the Gateway Token PDA for a wallet
     *
     * Gateway Tokens are PDAs derived from:
     * - The wallet address
     * - "gateway" literal
     * - Seed offset [0u8; 8]
     * - Gatekeeper network pubkey
     */
    getGatewayTokenPda(walletAddress: string): string;
    /**
     * Check if a valid Civic Pass exists for a wallet
     */
    hasValidCivicPass(walletAddress: string): Promise<boolean>;
    /**
     * Parse Gateway Token account data
     *
     * Layout (simplified):
     * - version: u8 (1 byte)
     * - parent_gateway_token: Option<Pubkey> (1 + 32 = 33 bytes if Some, 1 if None)
     * - owner_wallet: Pubkey (32 bytes)
     * - owner_identity: Option<Pubkey> (1 + 32 = 33 bytes if Some, 1 if None)
     * - gatekeeper_network: Pubkey (32 bytes)
     * - issuing_gatekeeper: Pubkey (32 bytes)
     * - state: u8 (1 byte)
     * - expire_time: Option<i64> (1 + 8 = 9 bytes if Some, 1 if None)
     */
    private parseGatewayToken;
}
//# sourceMappingURL=KycServiceAdapter.d.ts.map