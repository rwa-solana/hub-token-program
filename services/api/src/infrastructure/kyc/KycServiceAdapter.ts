import { injectable, inject } from 'tsyringe';
import { PublicKey } from '@solana/web3.js';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../config/Config';
import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import {
  IKycService,
  KycVerificationResult,
  CreateAttestationParams,
  GatewayTokenState,
} from '../../application/ports/IKycService';

/**
 * Gateway Token State enum values
 */
const GATEWAY_TOKEN_STATE = {
  ACTIVE: 0,
  FROZEN: 1,
  REVOKED: 2,
} as const;

/**
 * Gateway Token structure layout offsets
 * Based on: https://github.com/identity-com/on-chain-identity-gateway/blob/develop/solana/program/src/state.rs
 */
const GATEWAY_TOKEN_LAYOUT = {
  VERSION_OFFSET: 0,
  PARENT_GATEWAY_TOKEN_OFFSET: 1,
  MIN_SIZE: 150,
};

/**
 * KYC Service Adapter - Integrates with Civic Gateway Protocol
 *
 * This service verifies Civic Pass (Gateway Token) status for wallets.
 * Civic Pass provides identity verification (KYC/AML) on Solana.
 *
 * Documentation: https://docs.civic.com
 */
@injectable()
export class KycServiceAdapter implements IKycService {
  private gatewayProgram: PublicKey;
  private gatekeeperNetwork: PublicKey;

  constructor(
    @inject(TOKENS.Config) private config: Config,
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter
  ) {
    this.gatewayProgram = new PublicKey(config.civic.gatewayProgramId);
    this.gatekeeperNetwork = new PublicKey(config.civic.gatekeeperNetwork);
  }

  /**
   * Verify if a wallet has a valid Civic Pass
   */
  async verifyKyc(walletAddress: string): Promise<KycVerificationResult> {
    try {
      const gatewayTokenPda = this.getGatewayTokenPda(walletAddress);
      const connection = this.solanaConnection.getConnection();

      const accountInfo = await connection.getAccountInfo(new PublicKey(gatewayTokenPda));

      if (!accountInfo) {
        return {
          isValid: false,
          status: 'pending',
          gatewayToken: null,
          gatewayTokenState: null,
          expiresAt: null,
          message: 'No Civic Pass found. Please complete identity verification.',
        };
      }

      // Verify account is owned by Civic Gateway program
      if (!accountInfo.owner.equals(this.gatewayProgram)) {
        return {
          isValid: false,
          status: 'rejected',
          gatewayToken: gatewayTokenPda,
          gatewayTokenState: null,
          expiresAt: null,
          message: 'Invalid Civic Pass: account not owned by Gateway program.',
        };
      }

      // Parse the gateway token data
      const tokenData = this.parseGatewayToken(accountInfo.data, walletAddress);

      if (!tokenData.isValid) {
        return {
          isValid: false,
          status: 'rejected',
          gatewayToken: gatewayTokenPda,
          gatewayTokenState: tokenData.state,
          expiresAt: null,
          message: tokenData.message,
        };
      }

      // Check expiration
      if (tokenData.expiresAt && tokenData.expiresAt < new Date()) {
        return {
          isValid: false,
          status: 'expired',
          gatewayToken: gatewayTokenPda,
          gatewayTokenState: tokenData.state,
          expiresAt: tokenData.expiresAt,
          message: 'Civic Pass has expired. Please renew your verification.',
        };
      }

      return {
        isValid: true,
        status: 'verified',
        gatewayToken: gatewayTokenPda,
        gatewayTokenState: tokenData.state,
        expiresAt: tokenData.expiresAt,
        message: 'Identity verified. You can transfer tokens.',
      };
    } catch (error) {
      console.error('[KYC] Verification error:', error);
      return {
        isValid: false,
        status: 'pending',
        gatewayToken: null,
        gatewayTokenState: null,
        expiresAt: null,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a mock attestation (devnet only)
   * @deprecated In production, users should complete KYC through Civic
   */
  async createAttestation(params: CreateAttestationParams): Promise<{
    attestationAccount: string;
    signature: string;
  }> {
    if (this.config.isProduction()) {
      throw new Error('Direct attestation creation not allowed on mainnet. Please use Civic Pass.');
    }

    const gatewayTokenPda = this.getGatewayTokenPda(params.walletAddress);

    console.log(`[KYC] Note: For devnet testing, users should obtain a Civic Pass through the Civic frontend.`);
    console.log(`[KYC] Gateway Token PDA for ${params.walletAddress}: ${gatewayTokenPda}`);

    // Return the expected PDA - actual creation happens through Civic
    return {
      attestationAccount: gatewayTokenPda,
      signature: 'use-civic-pass',
    };
  }

  /**
   * Derive the Gateway Token PDA for a wallet
   *
   * Gateway Tokens are PDAs derived from:
   * - The wallet address
   * - "gateway" literal
   * - Seed offset [0u8; 8]
   * - Gatekeeper network pubkey
   */
  getGatewayTokenPda(walletAddress: string): string {
    const wallet = new PublicKey(walletAddress);

    const [pda] = PublicKey.findProgramAddressSync(
      [
        wallet.toBuffer(),
        Buffer.from('gateway'),
        Buffer.alloc(8), // seed offset
        this.gatekeeperNetwork.toBuffer(),
      ],
      this.gatewayProgram
    );

    return pda.toString();
  }

  /**
   * Check if a valid Civic Pass exists for a wallet
   */
  async hasValidCivicPass(walletAddress: string): Promise<boolean> {
    const result = await this.verifyKyc(walletAddress);
    return result.isValid;
  }

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
  private parseGatewayToken(
    data: Buffer,
    expectedOwner: string
  ): {
    isValid: boolean;
    state: GatewayTokenState | null;
    expiresAt: Date | null;
    message: string;
  } {
    try {
      if (data.length < GATEWAY_TOKEN_LAYOUT.MIN_SIZE) {
        return {
          isValid: false,
          state: null,
          expiresAt: null,
          message: `Invalid Gateway Token: data too small (${data.length} bytes)`,
        };
      }

      // Parse version
      const version = data[GATEWAY_TOKEN_LAYOUT.VERSION_OFFSET];

      // Parse parent_gateway_token (Option<Pubkey>)
      let offset = GATEWAY_TOKEN_LAYOUT.PARENT_GATEWAY_TOKEN_OFFSET;
      const hasParent = data[offset] === 1;
      offset += hasParent ? 1 + 32 : 1;

      // Parse owner_wallet (Pubkey)
      const ownerWallet = new PublicKey(data.subarray(offset, offset + 32));
      offset += 32;

      // Verify owner matches
      if (ownerWallet.toString() !== expectedOwner) {
        return {
          isValid: false,
          state: null,
          expiresAt: null,
          message: 'Gateway Token owner mismatch',
        };
      }

      // Parse owner_identity (Option<Pubkey>)
      const hasIdentity = data[offset] === 1;
      offset += hasIdentity ? 1 + 32 : 1;

      // Parse gatekeeper_network (Pubkey)
      const gatekeeperNetwork = new PublicKey(data.subarray(offset, offset + 32));
      offset += 32;

      // Verify gatekeeper network matches
      if (!gatekeeperNetwork.equals(this.gatekeeperNetwork)) {
        return {
          isValid: false,
          state: null,
          expiresAt: null,
          message: 'Invalid gatekeeper network',
        };
      }

      // Skip issuing_gatekeeper (Pubkey)
      offset += 32;

      // Parse state
      const stateValue = data[offset];
      offset += 1;

      let state: GatewayTokenState;
      switch (stateValue) {
        case GATEWAY_TOKEN_STATE.ACTIVE:
          state = 'ACTIVE';
          break;
        case GATEWAY_TOKEN_STATE.FROZEN:
          state = 'FROZEN';
          break;
        case GATEWAY_TOKEN_STATE.REVOKED:
          state = 'REVOKED';
          break;
        default:
          return {
            isValid: false,
            state: null,
            expiresAt: null,
            message: `Invalid token state: ${stateValue}`,
          };
      }

      // Check if token is active
      if (state !== 'ACTIVE') {
        return {
          isValid: false,
          state,
          expiresAt: null,
          message: `Civic Pass is ${state}`,
        };
      }

      // Parse expire_time (Option<i64>)
      let expiresAt: Date | null = null;
      if (data.length > offset && data[offset] === 1) {
        offset += 1;
        if (data.length >= offset + 8) {
          const expireTimestamp = data.readBigInt64LE(offset);
          if (expireTimestamp > 0n) {
            expiresAt = new Date(Number(expireTimestamp) * 1000);
          }
        }
      }

      return {
        isValid: true,
        state,
        expiresAt,
        message: 'Valid Civic Pass',
      };
    } catch (error) {
      console.error('[KYC] Error parsing Gateway Token:', error);
      return {
        isValid: false,
        state: null,
        expiresAt: null,
        message: `Failed to parse Gateway Token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
