import { IRevenueRepository } from '../ports/IRevenueRepository';
import { IPropertyRepository } from '../ports/IPropertyRepository';
import { IInvestorRepository } from '../ports/IInvestorRepository';
export interface ClaimableEpochDTO {
    epochAccount: string;
    epochNumber: number;
    propertyMint: string;
    propertyName: string;
    claimableAmount: string;
    claimed: boolean;
    claimedAt: string | null;
}
export interface ClaimableRevenueDTO {
    walletAddress: string;
    totalClaimable: string;
    epochs: ClaimableEpochDTO[];
}
export declare class GetClaimableRevenueUseCase {
    private revenueRepository;
    private propertyRepository;
    private investorRepository;
    constructor(revenueRepository: IRevenueRepository, propertyRepository: IPropertyRepository, investorRepository: IInvestorRepository);
    execute(walletAddress: string): Promise<ClaimableRevenueDTO>;
}
//# sourceMappingURL=GetClaimableRevenueUseCase.d.ts.map