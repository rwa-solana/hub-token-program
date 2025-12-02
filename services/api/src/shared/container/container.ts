import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { TOKENS } from './tokens';

// Infrastructure imports
import { SolanaConnectionAdapter } from '../../infrastructure/solana/SolanaConnectionAdapter';
import { SolanaProgramAdapter } from '../../infrastructure/solana/SolanaProgramAdapter';
import { AdminService } from '../../infrastructure/solana/AdminService';
import { HubCredentialServiceAdapter } from '../../infrastructure/kyc/HubCredentialServiceAdapter';
import { IpfsService } from '../../infrastructure/ipfs/IpfsService';
import { Logger } from '../utils/Logger';
import { Config } from '../../infrastructure/config/Config';

// Repository implementations
import { PropertyRepositoryImpl } from '../../infrastructure/repositories/PropertyRepositoryImpl';
import { InvestorRepositoryImpl } from '../../infrastructure/repositories/InvestorRepositoryImpl';
import { RevenueRepositoryImpl } from '../../infrastructure/repositories/RevenueRepositoryImpl';

// Use Cases
import { GetPropertiesUseCase } from '../../application/use-cases/GetPropertiesUseCase';
import { GetPropertyByMintUseCase } from '../../application/use-cases/GetPropertyByMintUseCase';
import { VerifyKycUseCase } from '../../application/use-cases/VerifyKycUseCase';
import { CreateKycAttestationUseCase } from '../../application/use-cases/CreateKycAttestationUseCase';
import { GetInvestorPortfolioUseCase } from '../../application/use-cases/GetInvestorPortfolioUseCase';
import { GetRevenueHistoryUseCase } from '../../application/use-cases/GetRevenueHistoryUseCase';
import { GetClaimableRevenueUseCase } from '../../application/use-cases/GetClaimableRevenueUseCase';

/**
 * Configure dependency injection container
 */
export function configureContainer(): DependencyContainer {
  // Register Config
  container.registerSingleton(TOKENS.Config, Config);

  // Register Logger
  container.registerSingleton(TOKENS.Logger, Logger);

  // Register Infrastructure
  container.registerSingleton(TOKENS.SolanaConnection, SolanaConnectionAdapter);
  container.registerSingleton(TOKENS.SolanaProgram, SolanaProgramAdapter);
  container.registerSingleton(TOKENS.AdminService, AdminService);
  container.registerSingleton(TOKENS.KycService, HubCredentialServiceAdapter);
  container.registerSingleton(TOKENS.IpfsService, IpfsService);

  // Register Repositories
  container.registerSingleton(TOKENS.PropertyRepository, PropertyRepositoryImpl);
  container.registerSingleton(TOKENS.InvestorRepository, InvestorRepositoryImpl);
  container.registerSingleton(TOKENS.RevenueRepository, RevenueRepositoryImpl);

  // Use cases are auto-registered via @injectable() decorator

  return container;
}

export { container };
