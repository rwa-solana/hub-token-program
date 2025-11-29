// Property Types
export interface Property {
  mint: string;
  name: string;
  symbol: string;
  authority: string;
  status: PropertyStatus;
  totalSupply: string;
  circulatingSupply: string;
  availableSupply: string;
  decimals: number;
  details: PropertyDetails;
  currentEpoch: number;
  createdAt: string;
}

export interface PropertyDetails {
  propertyType: string;
  location: string;
  totalValueUsd: number;
  valuePerToken: number;
  annualYieldPercent: number;
  metadataUri?: string;
  image?: string;
}

export interface PropertyDetail extends Property {
  revenue: {
    totalDistributed: string;
    unclaimed: string;
    currentEpochAmount: string | null;
    currentEpochStatus: string | null;
  };
}

export type PropertyStatus = 'active' | 'paused' | 'frozen';

export interface PropertyFilter {
  status?: PropertyStatus;
  minValue?: number;
  maxValue?: number;
  propertyType?: string;
}

// KYC Types
export type KycStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type GatewayTokenState = 'ACTIVE' | 'FROZEN' | 'REVOKED';

export interface KycVerification {
  walletAddress: string;
  isVerified: boolean;
  status: KycStatus;
  gatewayToken: string | null;
  gatewayTokenState: GatewayTokenState | null;
  expiresAt: string | null;
  message: string;
}

/**
 * @deprecated Use Civic Pass frontend flow for Gateway Token creation
 */
export interface CreateAttestationResult {
  walletAddress: string;
  gatewayTokenPda: string;
  signature: string;
  message: string;
}

// Civic Pass Types
export type CivicPassState = 'ACTIVE' | 'FROZEN' | 'REVOKED';

export interface CivicPassInfo {
  hasPass: boolean;
  isActive: boolean;
  state: CivicPassState | null;
  gatewayToken: string | null;
  expiresAt: string | null;
  message: string;
}

// Portfolio Types
export interface TokenHolding {
  propertyMint: string;
  propertyName: string;
  propertySymbol: string;
  tokenAccount: string;
  balance: string;
  percentage: number;
  valueUsd: number;
}

export interface Portfolio {
  walletAddress: string;
  kycStatus: KycStatus;
  kycVerified: boolean;
  kycExpiresAt: string | null;
  holdings: TokenHolding[];
  totalValueUsd: number;
  totalProperties: number;
}

// Revenue Types
export interface RevenueEpoch {
  account: string;
  epochNumber: number;
  totalAmount: string;
  totalClaimed: string;
  remainingAmount: string;
  status: string;
  distributedAt: string;
  expiresAt: string | null;
}

export interface RevenueHistory {
  propertyMint: string;
  propertyName: string;
  totalDistributed: string;
  totalUnclaimed: string;
  epochs: RevenueEpoch[];
}

export interface ClaimableEpoch {
  epochAccount: string;
  epochNumber: number;
  propertyMint: string;
  propertyName: string;
  claimableAmount: string;
  claimed: boolean;
  claimedAt: string | null;
}

export interface ClaimableRevenue {
  walletAddress: string;
  totalClaimable: string;
  epochs: ClaimableEpoch[];
}
