import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
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

@injectable()
export class GetClaimableRevenueUseCase {
  constructor(
    @inject(TOKENS.RevenueRepository) private revenueRepository: IRevenueRepository,
    @inject(TOKENS.PropertyRepository) private propertyRepository: IPropertyRepository,
    @inject(TOKENS.InvestorRepository) private investorRepository: IInvestorRepository
  ) {}

  async execute(walletAddress: string): Promise<ClaimableRevenueDTO> {
    const properties = await this.propertyRepository.findAll();
    const propertyMints = properties.map(p => p.mint);

    // Get investor holdings
    const holdings = await this.investorRepository.getHoldings(walletAddress, propertyMints);
    const heldProperties = holdings.map(h => h.propertyMint);

    const claimableEpochs: ClaimableEpochDTO[] = [];
    let totalClaimable = 0n;

    for (const propertyMint of heldProperties) {
      const property = properties.find(p => p.mint === propertyMint);
      if (!property) continue;

      const epochs = await this.revenueRepository.findAllEpochsByProperty(propertyMint);

      for (const epoch of epochs) {
        const claimRecord = await this.revenueRepository.findClaimRecord(
          epoch.account,
          walletAddress
        );

        const claimableAmount = await this.revenueRepository.getClaimableAmount(
          epoch.account,
          walletAddress
        );

        if (claimableAmount > 0n || claimRecord) {
          claimableEpochs.push({
            epochAccount: epoch.account,
            epochNumber: epoch.epochNumber,
            propertyMint,
            propertyName: property.name,
            claimableAmount: claimableAmount.toString(),
            claimed: claimRecord?.claimed ?? false,
            claimedAt: claimRecord?.claimedAt?.toISOString() ?? null,
          });

          if (!claimRecord?.claimed) {
            totalClaimable += claimableAmount;
          }
        }
      }
    }

    return {
      walletAddress,
      totalClaimable: totalClaimable.toString(),
      epochs: claimableEpochs,
    };
  }
}
