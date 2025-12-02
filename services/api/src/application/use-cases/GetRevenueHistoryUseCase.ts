import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
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

@injectable()
export class GetRevenueHistoryUseCase {
  constructor(
    @inject(TOKENS.RevenueRepository) private revenueRepository: IRevenueRepository,
    @inject(TOKENS.PropertyRepository) private propertyRepository: IPropertyRepository
  ) {}

  async execute(propertyMint: string): Promise<RevenueHistoryDTO | null> {
    const property = await this.propertyRepository.findByMint(propertyMint);
    if (!property) return null;

    const epochs = await this.revenueRepository.findAllEpochsByProperty(propertyMint);
    const totalDistributed = await this.revenueRepository.getTotalDistributed(propertyMint);
    const totalUnclaimed = await this.revenueRepository.getUnclaimedAmount(propertyMint);

    return {
      propertyMint,
      propertyName: property.name,
      totalDistributed: totalDistributed.toString(),
      totalUnclaimed: totalUnclaimed.toString(),
      epochs: epochs.map(epoch => ({
        account: epoch.account,
        epochNumber: epoch.epochNumber,
        totalAmount: epoch.totalAmount.toString(),
        totalClaimed: epoch.totalClaimed.toString(),
        remainingAmount: (epoch.totalAmount - epoch.totalClaimed).toString(),
        status: epoch.status,
        distributedAt: epoch.distributedAt.toISOString(),
        expiresAt: epoch.expiresAt?.toISOString() ?? null,
      })),
    };
  }
}
