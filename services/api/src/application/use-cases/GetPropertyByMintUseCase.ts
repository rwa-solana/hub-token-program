import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
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
    metadataUri?: string;
    image?: string;
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

@injectable()
export class GetPropertyByMintUseCase {
  constructor(
    @inject(TOKENS.PropertyRepository) private propertyRepository: IPropertyRepository,
    @inject(TOKENS.RevenueRepository) private revenueRepository: IRevenueRepository
  ) {}

  async execute(mint: string): Promise<PropertyDetailDTO | null> {
    const property = await this.propertyRepository.findByMint(mint);
    if (!property) return null;

    const totalDistributed = await this.revenueRepository.getTotalDistributed(mint);
    const unclaimed = await this.revenueRepository.getUnclaimedAmount(mint);
    const currentEpoch = await this.revenueRepository.findCurrentEpoch(mint);

    // Convert from base units to display units (divide by 10^decimals)
    const decimalsMultiplier = Math.pow(10, property.decimals);
    const totalSupplyDisplay = Number(property.totalSupply) / decimalsMultiplier;
    const circulatingSupplyDisplay = Number(property.circulatingSupply) / decimalsMultiplier;
    const availableSupplyDisplay = totalSupplyDisplay - circulatingSupplyDisplay;

    // Convert from cents to dollars
    const totalValueUsdDollars = property.details.totalValueUsd / 100;
    const annualYieldPercent = property.details.annualYieldPercent / 100;

    // Calculate value per token
    const valuePerToken = totalSupplyDisplay > 0
      ? totalValueUsdDollars / totalSupplyDisplay
      : 0;

    return {
      mint: property.mint,
      name: property.name,
      symbol: property.symbol,
      authority: property.authority,
      status: property.status,
      totalSupply: totalSupplyDisplay.toString(),
      circulatingSupply: circulatingSupplyDisplay.toString(),
      availableSupply: availableSupplyDisplay.toString(),
      decimals: property.decimals,
      details: {
        propertyType: property.details.propertyType,
        location: property.details.location,
        totalValueUsd: totalValueUsdDollars,
        valuePerToken,
        annualYieldPercent,
        metadataUri: property.details.metadataUri,
        image: property.details.image,
      },
      currentEpoch: property.currentEpoch,
      createdAt: property.createdAt.toISOString(),
      revenue: {
        totalDistributed: totalDistributed.toString(),
        unclaimed: unclaimed.toString(),
        currentEpochAmount: currentEpoch?.totalAmount.toString() ?? null,
        currentEpochStatus: currentEpoch?.status ?? null,
      },
    };
  }
}
