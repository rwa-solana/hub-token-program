import { InvestorEntity, KycStatus, TokenHolding } from '../../domain/entities';
export interface IInvestorRepository {
    findByWallet(walletAddress: string): Promise<InvestorEntity | null>;
    getHoldings(walletAddress: string, propertyMints: string[]): Promise<TokenHolding[]>;
    getKycStatus(walletAddress: string): Promise<KycStatus>;
    isKycVerified(walletAddress: string): Promise<boolean>;
    findByProperty(propertyMint: string): Promise<InvestorEntity[]>;
    countByProperty(propertyMint: string): Promise<number>;
}
//# sourceMappingURL=IInvestorRepository.d.ts.map