import { injectable, inject } from 'tsyringe';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TOKENS } from '../../shared/container/tokens';
import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import { IKycService } from '../../application/ports/IKycService';
import { IInvestorRepository } from '../../application/ports/IInvestorRepository';
import { InvestorEntity, TokenHolding, KycStatus } from '../../domain/entities';

@injectable()
export class InvestorRepositoryImpl implements IInvestorRepository {
  constructor(
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter,
    @inject(TOKENS.KycService) private kycService: IKycService
  ) {}

  async findByWallet(walletAddress: string): Promise<InvestorEntity | null> {
    try {
      const wallet = new PublicKey(walletAddress);
      const connection = this.solanaConnection.getConnection();

      const accountInfo = await connection.getAccountInfo(wallet);
      if (!accountInfo) return null;

      const kycResult = await this.kycService.verifyKyc(walletAddress);

      return InvestorEntity.fromKycResult(walletAddress, {
        status: kycResult.status as KycStatus,
        gatewayToken: kycResult.gatewayToken,
        expiresAt: kycResult.expiresAt,
      });
    } catch {
      return null;
    }
  }

  async getHoldings(walletAddress: string, propertyMints: string[]): Promise<TokenHolding[]> {
    const holdings: TokenHolding[] = [];
    const wallet = new PublicKey(walletAddress);
    const connection = this.solanaConnection.getConnection();

    for (const mintAddress of propertyMints) {
      try {
        const mint = new PublicKey(mintAddress);
        const ata = getAssociatedTokenAddressSync(
          mint,
          wallet,
          false,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const accountInfo = await getAccount(
          connection,
          ata,
          'confirmed',
          TOKEN_2022_PROGRAM_ID
        );

        if (accountInfo.amount > 0n) {
          holdings.push({
            propertyMint: mintAddress,
            tokenAccount: ata.toString(),
            balance: accountInfo.amount,
            percentage: 0,
          });
        }
      } catch {
        continue;
      }
    }

    return holdings;
  }

  async getKycStatus(walletAddress: string): Promise<KycStatus> {
    const result = await this.kycService.verifyKyc(walletAddress);
    return result.status as KycStatus;
  }

  async isKycVerified(walletAddress: string): Promise<boolean> {
    const result = await this.kycService.verifyKyc(walletAddress);
    return result.isValid;
  }

  async findByProperty(_propertyMint: string): Promise<InvestorEntity[]> {
    console.log('[InvestorRepository] findByProperty requires token indexer service');
    return [];
  }

  async countByProperty(propertyMint: string): Promise<number> {
    const investors = await this.findByProperty(propertyMint);
    return investors.length;
  }
}
