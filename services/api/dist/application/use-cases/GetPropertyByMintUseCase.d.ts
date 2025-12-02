import { IPropertyRepository } from '../ports/IPropertyRepository';
import { IRevenueRepository } from '../ports/IRevenueRepository';
export interface PropertyDetailDTO {
    mint: string;
    name: string;
    symbol: string;
    authority: string;
    status: string;
    totalSupply: string;
    circulatingSupply: string;
    availableSupply: string;
    decimals: number;
    details: {
        propertyType: string;
        location: string;
        totalValueUsd: number;
        valuePerToken: number;
        annualYieldPercent: number;
    };
    currentEpoch: number;
    createdAt: string;
    revenue: {
        totalDistributed: string;
        unclaimed: string;
        currentEpochAmount: string | null;
        currentEpochStatus: string | null;
    };
}
export declare class GetPropertyByMintUseCase {
    private propertyRepository;
    private revenueRepository;
    constructor(propertyRepository: IPropertyRepository, revenueRepository: IRevenueRepository);
    execute(mint: string): Promise<PropertyDetailDTO | null>;
}
//# sourceMappingURL=GetPropertyByMintUseCase.d.ts.map