import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IPropertyRepository, PropertyFilter } from '../ports/IPropertyRepository';
import { Property } from '../../domain/entities';

export interface GetPropertiesInput {
  filter?: PropertyFilter;
}

export interface PropertyDTO {
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
}

@injectable()
export class GetPropertiesUseCase {
  constructor(
    @inject(TOKENS.PropertyRepository) private propertyRepository: IPropertyRepository
  ) {}

  async execute(input?: GetPropertiesInput): Promise<PropertyDTO[]> {
    const properties = await this.propertyRepository.findAll(input?.filter);
    return properties.map((p) => this.toDTO(p));
  }

  private toDTO(property: Property): PropertyDTO {
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
    };
  }
}
