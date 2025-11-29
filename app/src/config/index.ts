import { PublicKey } from '@solana/web3.js';

/**
 * Civic Gatekeeper Networks
 *
 * These are the available Civic Pass verification networks:
 * - uniqueness: Basic bot protection, proof of unique human
 * - idVerification: Full KYC/AML verification (required for securities)
 * - captcha: Simple CAPTCHA-based verification
 *
 * For RWA/Securities like property tokens, use ID Verification.
 */
export const CIVIC_GATEKEEPER_NETWORKS = {
  // Uniqueness verification (proof of human)
  uniqueness: new PublicKey('tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf'),
  // ID Verification (full KYC/AML) - REQUIRED for securities
  idVerification: new PublicKey('bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw'),
  // CAPTCHA verification (basic bot protection)
  captcha: new PublicKey('ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6'),
} as const;

/**
 * Civic Gateway Program ID
 * This is the official Civic Gateway Protocol program on Solana
 */
export const CIVIC_GATEWAY_PROGRAM_ID = new PublicKey('gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs');

export const config = {
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://solana-devnet.g.alchemy.com/v2/bctNGkPdumegFbmG338QD',
    programId: import.meta.env.VITE_PROGRAM_ID || 'FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  },
  civic: {
    // For testing: Use Uniqueness (free). For production: Use idVerification (requires paid Civic account)
    gatekeeperNetwork: CIVIC_GATEKEEPER_NETWORKS.uniqueness,
    // Cluster for Civic Pass (should match solana.network)
    cluster: (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta',
  },
} as const;
