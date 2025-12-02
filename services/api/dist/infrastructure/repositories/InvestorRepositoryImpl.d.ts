import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import { IKycService } from '../../application/ports/IKycService';
import { IInvestorRepository } from '../../application/ports/IInvestorRepository';
import { InvestorEntity, TokenHolding, KycStatus } from '../../domain/entities';
export declare class InvestorRepositoryImpl implements IInvestorRepository {
    private solanaConnection;
    private kycService;
    constructor(solanaConnection: SolanaConnectionAdapter, kycService: IKycService);
    findByWallet(walletAddress: string): Promise<InvestorEntity | null>;
    getHoldings(walletAddress: string, propertyMints: string[]): Promise<TokenHolding[]>;
    getKycStatus(walletAddress: string): Promise<KycStatus>;
    isKycVerified(walletAddress: string): Promise<boolean>;
    findByProperty(_propertyMint: string): Promise<InvestorEntity[]>;
    countByProperty(propertyMint: string): Promise<number>;
}
//# sourceMappingURL=InvestorRepositoryImpl.d.ts.map