"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInvestorPortfolioUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const tokens_1 = require("../../shared/container/tokens");
let GetInvestorPortfolioUseCase = class GetInvestorPortfolioUseCase {
    investorRepository;
    propertyRepository;
    kycService;
    constructor(investorRepository, propertyRepository, kycService) {
        this.investorRepository = investorRepository;
        this.propertyRepository = propertyRepository;
        this.kycService = kycService;
    }
    async execute(walletAddress) {
        // Get KYC status
        const kycResult = await this.kycService.verifyKyc(walletAddress);
        // Get all properties
        const properties = await this.propertyRepository.findAll();
        const propertyMints = properties.map(p => p.mint);
        // Get holdings for all properties
        const holdings = await this.investorRepository.getHoldings(walletAddress, propertyMints);
        // Map holdings to DTOs with property details
        const holdingsDTO = [];
        let totalValueUsd = 0;
        for (const holding of holdings) {
            const property = properties.find(p => p.mint === holding.propertyMint);
            if (!property)
                continue;
            const percentage = Number(holding.balance) / Number(property.totalSupply) * 100;
            const valuePerToken = property.totalSupply > 0n
                ? property.details.totalValueUsd / Number(property.totalSupply)
                : 0;
            const valueUsd = valuePerToken * Number(holding.balance) / Math.pow(10, property.decimals);
            holdingsDTO.push({
                propertyMint: holding.propertyMint,
                propertyName: property.name,
                propertySymbol: property.symbol,
                tokenAccount: holding.tokenAccount,
                balance: holding.balance.toString(),
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
};
exports.GetInvestorPortfolioUseCase = GetInvestorPortfolioUseCase;
exports.GetInvestorPortfolioUseCase = GetInvestorPortfolioUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.InvestorRepository)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.PropertyRepository)),
    __param(2, (0, tsyringe_1.inject)(tokens_1.TOKENS.KycService)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GetInvestorPortfolioUseCase);
//# sourceMappingURL=GetInvestorPortfolioUseCase.js.map