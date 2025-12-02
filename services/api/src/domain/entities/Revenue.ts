/**
 * Revenue Entity - Represents dividend distribution epochs
 */
export type EpochStatus = 'active' | 'finalized' | 'expired';

export interface RevenueEpoch {
  account: string;
  propertyMint: string;
  epochNumber: number;
  totalAmount: bigint;
  totalClaimed: bigint;
  status: EpochStatus;
  distributedAt: Date;
  expiresAt: Date | null;
}

export interface ClaimRecord {
  account: string;
  epochAccount: string;
  investorWallet: string;
  amountClaimed: bigint;
  claimed: boolean;
  claimedAt: Date | null;
}

export class RevenueEpochEntity implements RevenueEpoch {
  public readonly account: string;
  public readonly propertyMint: string;
  public readonly epochNumber: number;
  public readonly totalAmount: bigint;
  public totalClaimed: bigint;
  public status: EpochStatus;
  public readonly distributedAt: Date;
  public readonly expiresAt: Date | null;

  constructor(data: RevenueEpoch) {
    this.account = data.account;
    this.propertyMint = data.propertyMint;
    this.epochNumber = data.epochNumber;
    this.totalAmount = data.totalAmount;
    this.totalClaimed = data.totalClaimed;
    this.status = data.status;
    this.distributedAt = data.distributedAt;
    this.expiresAt = data.expiresAt;
  }

  get remainingAmount(): bigint {
    return this.totalAmount - this.totalClaimed;
  }

  calculateClaimAmount(investorBalance: bigint, totalSupply: bigint): bigint {
    if (totalSupply === 0n) return 0n;
    return (investorBalance * this.totalAmount) / totalSupply;
  }

  static fromOnChain(data: any, account: string, propertyMint: string): RevenueEpochEntity {
    return new RevenueEpochEntity({
      account,
      propertyMint,
      epochNumber: Number(data.epochNumber?.toString() || '0'),
      totalAmount: BigInt(data.totalRevenue?.toString() || data.totalAmount?.toString() || '0'),
      totalClaimed: BigInt(data.totalClaimed?.toString() || '0'),
      status: data.isFinalized ? 'finalized' : 'active',
      distributedAt: data.depositedAt
        ? new Date(Number(data.depositedAt.toString()) * 1000)
        : new Date(),
      expiresAt: data.expiresAt
        ? new Date(Number(data.expiresAt.toString()) * 1000)
        : null,
    });
  }
}

export class ClaimRecordEntity implements ClaimRecord {
  public readonly account: string;
  public readonly epochAccount: string;
  public readonly investorWallet: string;
  public readonly amountClaimed: bigint;
  public readonly claimed: boolean;
  public readonly claimedAt: Date | null;

  constructor(data: ClaimRecord) {
    this.account = data.account;
    this.epochAccount = data.epochAccount;
    this.investorWallet = data.investorWallet;
    this.amountClaimed = data.amountClaimed;
    this.claimed = data.claimed;
    this.claimedAt = data.claimedAt;
  }

  static fromOnChain(data: any, account: string, epochAccount: string): ClaimRecordEntity {
    return new ClaimRecordEntity({
      account,
      epochAccount,
      investorWallet: data.investor?.toString() || '',
      amountClaimed: BigInt(data.amountClaimed?.toString() || '0'),
      claimed: data.claimed || false,
      claimedAt: data.claimedAt && Number(data.claimedAt.toString()) > 0
        ? new Date(Number(data.claimedAt.toString()) * 1000)
        : null,
    });
  }
}
