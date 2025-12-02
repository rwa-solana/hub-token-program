"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestorEntity = void 0;
class InvestorEntity {
    walletAddress;
    kyc;
    holdings;
    totalInvestedUsd;
    joinedAt;
    constructor(data) {
        this.walletAddress = data.walletAddress;
        this.kyc = data.kyc;
        this.holdings = data.holdings;
        this.totalInvestedUsd = data.totalInvestedUsd;
        this.joinedAt = data.joinedAt;
    }
    get isKycVerified() {
        return (this.kyc.status === 'verified' &&
            (this.kyc.expiresAt === null || this.kyc.expiresAt > new Date()));
    }
    static fromKycResult(walletAddress, kycResult) {
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
exports.InvestorEntity = InvestorEntity;
//# sourceMappingURL=Investor.js.map