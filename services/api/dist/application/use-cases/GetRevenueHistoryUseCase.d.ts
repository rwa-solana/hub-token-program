import { IRevenueRepository } from '../ports/IRevenueRepository';
import { IPropertyRepository } from '../ports/IPropertyRepository';
export interface EpochDTO {
    account: string;
    epochNumber: number;
    totalAmount: string;
    totalClaimed: string;
    remainingAmount: string;
    status: string;
    distributedAt: string;
    expiresAt: string | null;
}
export interface RevenueHistoryDTO {
    propertyMint: string;
    propertyName: string;
    totalDistributed: string;
    totalUnclaimed: string;
    epochs: EpochDTO[];
}
export declare class GetRevenueHistoryUseCase {
    private revenueRepository;
    private propertyRepository;
    constructor(revenueRepository: IRevenueRepository, propertyRepository: IPropertyRepository);
    execute(propertyMint: string): Promise<RevenueHistoryDTO | null>;
}
//# sourceMappingURL=GetRevenueHistoryUseCase.d.ts.map