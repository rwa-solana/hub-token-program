import { SolanaProgramAdapter } from '../solana/SolanaProgramAdapter';
import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import { IRevenueRepository } from '../../application/ports/IRevenueRepository';
import { RevenueEpochEntity, ClaimRecordEntity } from '../../domain/entities';
export declare class RevenueRepositoryImpl implements IRevenueRepository {
    private programAdapter;
    private solanaConnection;
    constructor(programAdapter: SolanaProgramAdapter, solanaConnection: SolanaConnectionAdapter);
    findEpochByProperty(propertyMint: string, epochNumber: number): Promise<RevenueEpochEntity | null>;
    findCurrentEpoch(propertyMint: string): Promise<RevenueEpochEntity | null>;
    findAllEpochsByProperty(propertyMint: string): Promise<RevenueEpochEntity[]>;
    findClaimRecord(epochAccount: string, investorWallet: string): Promise<ClaimRecordEntity | null>;
    getClaimableAmount(epochAccount: string, investorWallet: string): Promise<bigint>;
    getTotalDistributed(propertyMint: string): Promise<bigint>;
    getUnclaimedAmount(propertyMint: string): Promise<bigint>;
}
//# sourceMappingURL=RevenueRepositoryImpl.d.ts.map