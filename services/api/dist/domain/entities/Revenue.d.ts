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
export declare class RevenueEpochEntity implements RevenueEpoch {
    readonly account: string;
    readonly propertyMint: string;
    readonly epochNumber: number;
    readonly totalAmount: bigint;
    totalClaimed: bigint;
    status: EpochStatus;
    readonly distributedAt: Date;
    readonly expiresAt: Date | null;
    constructor(data: RevenueEpoch);
    get remainingAmount(): bigint;
    calculateClaimAmount(investorBalance: bigint, totalSupply: bigint): bigint;
    static fromOnChain(data: any, account: string, propertyMint: string): RevenueEpochEntity;
}
export declare class ClaimRecordEntity implements ClaimRecord {
    readonly account: string;
    readonly epochAccount: string;
    readonly investorWallet: string;
    readonly amountClaimed: bigint;
    readonly claimed: boolean;
    readonly claimedAt: Date | null;
    constructor(data: ClaimRecord);
    static fromOnChain(data: any, account: string, epochAccount: string): ClaimRecordEntity;
}
//# sourceMappingURL=Revenue.d.ts.map