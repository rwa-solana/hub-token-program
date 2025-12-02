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
export declare class InvestorEntity implements Investor {
    readonly walletAddress: string;
    kyc: InvestorKyc;
    holdings: string[];
    totalInvestedUsd: number;
    readonly joinedAt: Date;
    constructor(data: Investor);
    get isKycVerified(): boolean;
    static fromKycResult(walletAddress: string, kycResult: {
        status: KycStatus;
        gatewayToken: string | null;
        expiresAt: Date | null;
    }): InvestorEntity;
}
//# sourceMappingURL=Investor.d.ts.map