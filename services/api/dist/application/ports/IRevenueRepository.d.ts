import { RevenueEpochEntity, ClaimRecordEntity } from '../../domain/entities';
export interface IRevenueRepository {
    /**
     * Find revenue epoch by property and epoch number
     */
    findEpochByProperty(propertyMint: string, epochNumber: number): Promise<RevenueEpochEntity | null>;
    /**
     * Find current active epoch for a property
     */
    findCurrentEpoch(propertyMint: string): Promise<RevenueEpochEntity | null>;
    /**
     * Find all epochs for a property
     */
    findAllEpochsByProperty(propertyMint: string): Promise<RevenueEpochEntity[]>;
    /**
     * Find claim record for an epoch and investor
     */
    findClaimRecord(epochAccount: string, investorWallet: string): Promise<ClaimRecordEntity | null>;
    /**
     * Get claimable amount for an investor in an epoch
     */
    getClaimableAmount(epochAccount: string, investorWallet: string): Promise<bigint>;
    /**
     * Get total distributed revenue for a property
     */
    getTotalDistributed(propertyMint: string): Promise<bigint>;
    /**
     * Get unclaimed revenue for a property
     */
    getUnclaimedAmount(propertyMint: string): Promise<bigint>;
}
//# sourceMappingURL=IRevenueRepository.d.ts.map