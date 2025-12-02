import { IInvestorRepository } from '../ports/IInvestorRepository';
import { IPropertyRepository } from '../ports/IPropertyRepository';
import { IKycService } from '../ports/IKycService';
export interface HoldingDTO {
    propertyMint: string;
    propertyName: string;
    propertySymbol: string;
    tokenAccount: string;
    balance: string;
    percentage: number;
    valueUsd: number;
}
export interface PortfolioDTO {
    walletAddress: string;
    kycStatus: string;
    kycVerified: boolean;
    kycExpiresAt: string | null;
    holdings: HoldingDTO[];
    totalValueUsd: number;
    totalProperties: number;
}
export declare class GetInvestorPortfolioUseCase {
    private investorRepository;
    private propertyRepository;
    private kycService;
    constructor(investorRepository: IInvestorRepository, propertyRepository: IPropertyRepository, kycService: IKycService);
    execute(walletAddress: string): Promise<PortfolioDTO>;
}
//# sourceMappingURL=GetInvestorPortfolioUseCase.d.ts.map