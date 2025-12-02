/**
 * Investor Entity - Represents a KYC-verified investor
 */
export type KycStatus = 'pending' | 'verified' | 'expired' | 'rejected';

export interface InvestorKyc {
  status: KycStatus;
  gatewayToken: string | null;
  expiresAt: Date | null;
}

export interface Investor {
  walletAddress: string;
  kyc: InvestorKyc;
  holdings: string[];
  totalInvestedUsd: number;
  joinedAt: Date;
}

export class InvestorEntity implements Investor {
  public readonly walletAddress: string;
  public kyc: InvestorKyc;
  public holdings: string[];
  public totalInvestedUsd: number;
  public readonly joinedAt: Date;

  constructor(data: Investor) {
    this.walletAddress = data.walletAddress;
    this.kyc = data.kyc;
    this.holdings = data.holdings;
    this.totalInvestedUsd = data.totalInvestedUsd;
    this.joinedAt = data.joinedAt;
  }

  get isKycVerified(): boolean {
    return (
      this.kyc.status === 'verified' &&
      (this.kyc.expiresAt === null || this.kyc.expiresAt > new Date())
    );
  }

  static fromKycResult(walletAddress: string, kycResult: {
    status: KycStatus;
    gatewayToken: string | null;
    expiresAt: Date | null;
  }): InvestorEntity {
    return new InvestorEntity({
      walletAddress,
      kyc: {
        status: kycResult.status,
        gatewayToken: kycResult.gatewayToken,
        expiresAt: kycResult.expiresAt,
      },
      holdings: [],
      totalInvestedUsd: 0,
      joinedAt: new Date(),
    });
  }
}
