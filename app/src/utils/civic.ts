import { Connection, PublicKey } from '@solana/web3.js';
import { findGatewayToken, GatewayToken, State } from '@identity.com/solana-gateway-ts';
import { config, CIVIC_GATEWAY_PROGRAM_ID } from '@/config';

/**
 * Gateway Token State
 * Represents the current state of a Civic Pass
 * Maps to @identity.com/solana-gateway-ts State enum
 */
export type GatewayTokenState = 'ACTIVE' | 'FROZEN' | 'REVOKED';

/**
 * Convert State enum to string
 */
function stateToString(state: State): GatewayTokenState {
  switch (state) {
    case State.ACTIVE:
      return 'ACTIVE';
    case State.FROZEN:
      return 'FROZEN';
    case State.REVOKED:
      return 'REVOKED';
    default:
      return 'REVOKED';
  }
}

/**
 * Civic Pass Status
 * User-friendly status representation
 */
export interface CivicPassStatus {
  hasPass: boolean;
  isActive: boolean;
  state: GatewayTokenState | null;
  gatewayToken: PublicKey | null;
  expiresAt: Date | null;
  message: string;
}

/**
 * Find the Gateway Token (Civic Pass) for a wallet
 *
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @returns Gateway token or null if not found
 */
export async function getGatewayToken(
  connection: Connection,
  wallet: PublicKey
): Promise<GatewayToken | null> {
  try {
    const token = await findGatewayToken(
      connection,
      wallet,
      config.civic.gatekeeperNetwork
    );
    return token;
  } catch (error) {
    console.error('Error finding gateway token:', error);
    return null;
  }
}

/**
 * Get the Civic Pass status for a wallet
 *
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @returns Civic Pass status
 */
export async function getCivicPassStatus(
  connection: Connection,
  wallet: PublicKey
): Promise<CivicPassStatus> {
  const token = await getGatewayToken(connection, wallet);

  if (!token) {
    return {
      hasPass: false,
      isActive: false,
      state: null,
      gatewayToken: null,
      expiresAt: null,
      message: 'No Civic Pass found. Please complete identity verification.',
    };
  }

  const tokenState = stateToString(token.state);
  const isActive = tokenState === 'ACTIVE';
  const isExpired = token.expiryTime ? new Date(token.expiryTime * 1000) < new Date() : false;

  let message: string;
  if (isExpired) {
    message = 'Your Civic Pass has expired. Please renew your verification.';
  } else if (!isActive) {
    message = `Your Civic Pass is ${tokenState}. Please contact support.`;
  } else {
    message = 'Your identity has been verified. You can transfer tokens.';
  }

  return {
    hasPass: true,
    isActive: isActive && !isExpired,
    state: tokenState,
    gatewayToken: token.publicKey,
    expiresAt: token.expiryTime ? new Date(token.expiryTime * 1000) : null,
    message,
  };
}

/**
 * Derive the Gateway Token PDA for a wallet
 * This can be used to find the expected gateway token address
 *
 * @param wallet - Wallet public key
 * @returns Gateway token PDA address
 */
export function deriveGatewayTokenPda(wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      wallet.toBuffer(),
      Buffer.from('gateway'),
      Buffer.alloc(8), // seed offset
      config.civic.gatekeeperNetwork.toBuffer(),
    ],
    CIVIC_GATEWAY_PROGRAM_ID
  );
  return pda;
}

/**
 * Check if an address is likely a Gateway Token account
 *
 * @param connection - Solana connection
 * @param address - Address to check
 * @returns True if the address is owned by the Gateway program
 */
export async function isGatewayTokenAccount(
  connection: Connection,
  address: PublicKey
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(address);
    return accountInfo?.owner.equals(CIVIC_GATEWAY_PROGRAM_ID) ?? false;
  } catch {
    return false;
  }
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiresAt: Date | null): string {
  if (!expiresAt) return 'No expiry';

  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return 'Expired';
  } else if (daysUntilExpiry === 0) {
    return 'Expires today';
  } else if (daysUntilExpiry === 1) {
    return 'Expires tomorrow';
  } else if (daysUntilExpiry <= 7) {
    return `Expires in ${daysUntilExpiry} days`;
  } else {
    return expiresAt.toLocaleDateString();
  }
}
