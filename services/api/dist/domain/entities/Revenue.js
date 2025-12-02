"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimRecordEntity = exports.RevenueEpochEntity = void 0;
class RevenueEpochEntity {
    account;
    propertyMint;
    epochNumber;
    totalAmount;
    totalClaimed;
    status;
    distributedAt;
    expiresAt;
    constructor(data) {
        this.account = data.account;
        this.propertyMint = data.propertyMint;
        this.epochNumber = data.epochNumber;
        this.totalAmount = data.totalAmount;
        this.totalClaimed = data.totalClaimed;
        this.status = data.status;
        this.distributedAt = data.distributedAt;
        this.expiresAt = data.expiresAt;
    }
    get remainingAmount() {
        return this.totalAmount - this.totalClaimed;
    }
    calculateClaimAmount(investorBalance, totalSupply) {
        if (totalSupply === 0n)
            return 0n;
        return (investorBalance * this.totalAmount) / totalSupply;
    }
    static fromOnChain(data, account, propertyMint) {
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
exports.RevenueEpochEntity = RevenueEpochEntity;
class ClaimRecordEntity {
    account;
    epochAccount;
    investorWallet;
    amountClaimed;
    claimed;
    claimedAt;
    constructor(data) {
        this.account = data.account;
        this.epochAccount = data.epochAccount;
        this.investorWallet = data.investorWallet;
        this.amountClaimed = data.amountClaimed;
        this.claimed = data.claimed;
        this.claimedAt = data.claimedAt;
    }
    static fromOnChain(data, account, epochAccount) {
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
exports.ClaimRecordEntity = ClaimRecordEntity;
//# sourceMappingURL=Revenue.js.map