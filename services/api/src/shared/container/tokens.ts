/**
 * Dependency Injection Tokens
 * Used for registering and resolving dependencies
 */
export const TOKENS = {
  // Infrastructure
  SolanaConnection: Symbol.for('SolanaConnection'),
  SolanaProgram: Symbol.for('SolanaProgram'),
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),

  // Repositories
  PropertyRepository: Symbol.for('PropertyRepository'),
  InvestorRepository: Symbol.for('InvestorRepository'),
  RevenueRepository: Symbol.for('RevenueRepository'),

  // Services
  KycService: Symbol.for('KycService'),
  PropertyService: Symbol.for('PropertyService'),
  InvestorService: Symbol.for('InvestorService'),
  RevenueService: Symbol.for('RevenueService'),
  TransactionService: Symbol.for('TransactionService'),
  IpfsService: Symbol.for('IpfsService'),
  AdminService: Symbol.for('AdminService'),

  // Use Cases
  CreatePropertyUseCase: Symbol.for('CreatePropertyUseCase'),
  MintTokensUseCase: Symbol.for('MintTokensUseCase'),
  BurnTokensUseCase: Symbol.for('BurnTokensUseCase'),
  VerifyKycUseCase: Symbol.for('VerifyKycUseCase'),
  DepositRevenueUseCase: Symbol.for('DepositRevenueUseCase'),
  ClaimRevenueUseCase: Symbol.for('ClaimRevenueUseCase'),
  GetPropertiesUseCase: Symbol.for('GetPropertiesUseCase'),
  GetInvestorUseCase: Symbol.for('GetInvestorUseCase'),
} as const;

export type TokenKeys = keyof typeof TOKENS;
