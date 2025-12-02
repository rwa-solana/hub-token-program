/**
 * Dependency Injection Tokens
 * Used for registering and resolving dependencies
 */
export declare const TOKENS: {
    readonly SolanaConnection: symbol;
    readonly SolanaProgram: symbol;
    readonly Logger: symbol;
    readonly Config: symbol;
    readonly PropertyRepository: symbol;
    readonly InvestorRepository: symbol;
    readonly RevenueRepository: symbol;
    readonly KycService: symbol;
    readonly PropertyService: symbol;
    readonly InvestorService: symbol;
    readonly RevenueService: symbol;
    readonly TransactionService: symbol;
    readonly IpfsService: symbol;
    readonly CreatePropertyUseCase: symbol;
    readonly MintTokensUseCase: symbol;
    readonly BurnTokensUseCase: symbol;
    readonly VerifyKycUseCase: symbol;
    readonly DepositRevenueUseCase: symbol;
    readonly ClaimRevenueUseCase: symbol;
    readonly GetPropertiesUseCase: symbol;
    readonly GetInvestorUseCase: symbol;
};
export type TokenKeys = keyof typeof TOKENS;
//# sourceMappingURL=tokens.d.ts.map