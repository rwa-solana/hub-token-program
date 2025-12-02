import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IInvestorRepository } from '../ports/IInvestorRepository';
import { IPropertyRepository } from '../ports/IPropertyRepository';
import { IKycService } from '../ports/IKycService';

export interface HoldingDTO {
  propertyMint: string;
  propertyName: string;
  propertySymbol: string;
  tokenAccount: string;
  balance: string;
  percentage: number;
  valueUsd: number;
}

export interface PortfolioDTO {
  walletAddress: string;
  kycStatus: string;
  kycVerified: boolean;
  kycExpiresAt: string | null;
  holdings: HoldingDTO[];
  totalValueUsd: number;
  totalProperties: number;
}

@injectable()
export class GetInvestorPortfolioUseCase {
  constructor(
    @inject(TOKENS.InvestorRepository) private investorRepository: IInvestorRepository,
    @inject(TOKENS.PropertyRepository) private propertyRepository: IPropertyRepository,
    @inject(TOKENS.KycService) private kycService: IKycService
  ) {}

  async execute(walletAddress: string): Promise<PortfolioDTO> {
    // Get KYC status
    const kycResult = await this.kycService.verifyKyc(walletAddress);

    // Get all properties
    const properties = await this.propertyRepository.findAll();
    const propertyMints = properties.map(p => p.mint);

    // Get holdings for all properties
    const holdings = await this.investorRepository.getHoldings(walletAddress, propertyMints);

    // Map holdings to DTOs with property details
    const holdingsDTO: HoldingDTO[] = [];
    let totalValueUsd = 0;

    for (const holding of holdings) {
      const property = properties.find(p => p.mint === holding.propertyMint);
      if (!property) continue;

      // Both balance and totalSupply are stored with decimals (base units)
      // Convert both to display units (tokens)
      const decimalsMultiplier = Math.pow(10, property.decimals);
      const balanceTokens = Number(holding.balance) / decimalsMultiplier;
      const totalSupplyTokens = Number(property.totalSupply) / decimalsMultiplier;
      const percentage = totalSupplyTokens > 0 ? (balanceTokens / totalSupplyTokens) * 100 : 0;

      // totalValueUsd is stored in cents, convert to dollars
      const totalValueDollars = property.details.totalValueUsd / 100;
      const valuePerToken = totalSupplyTokens > 0 ? totalValueDollars / totalSupplyTokens : 0;
      const valueUsd = valuePerToken * balanceTokens;

      holdingsDTO.push({
        propertyMint: holding.propertyMint,
        propertyName: property.name,
        propertySymbol: property.symbol,
        tokenAccount: holding.tokenAccount,
        balance: balanceTokens.toString(),
        percentage,
        valueUsd,
      });

      totalValueUsd += valueUsd;
    }

    return {
      walletAddress,
      kycStatus: kycResult.status,
      kycVerified: kycResult.isValid,
      kycExpiresAt: kycResult.expiresAt?.toISOString() ?? null,
      holdings: holdingsDTO,
      totalValueUsd,
      totalProperties: holdingsDTO.length,
    };
  }
}
