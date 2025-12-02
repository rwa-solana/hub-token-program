import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Config } from '../config/Config';
import { SolanaConnectionAdapter } from './SolanaConnectionAdapter';
export declare class SolanaProgramAdapter {
    private config;
    private solanaConnection;
    private program;
    private provider;
    private programId;
    constructor(config: Config, solanaConnection: SolanaConnectionAdapter);
    getProgram(): Program | null;
    isInitialized(): boolean;
    getProgramId(): PublicKey;
    derivePropertyStatePda(mint: PublicKey): [PublicKey, number];
    deriveExtraAccountMetasPda(mint: PublicKey): [PublicKey, number];
    deriveRevenueEpochPda(propertyState: PublicKey, epochNumber: number): [PublicKey, number];
    deriveClaimRecordPda(revenueEpoch: PublicKey, investor: PublicKey): [PublicKey, number];
    deriveRevenueVaultPda(revenueEpoch: PublicKey): [PublicKey, number];
    fetchPropertyState(mint: PublicKey): Promise<unknown | null>;
    fetchAllProperties(): Promise<Array<{
        account: unknown;
        publicKey: PublicKey;
    }>>;
    fetchRevenueEpoch(propertyState: PublicKey, epochNumber: number): Promise<unknown | null>;
    getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey;
}
//# sourceMappingURL=SolanaProgramAdapter.d.ts.map