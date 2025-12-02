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
exports.InvestorRepositoryImpl = void 0;
const tsyringe_1 = require("tsyringe");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const spl_token_2 = require("@solana/spl-token");
const tokens_1 = require("../../shared/container/tokens");
const SolanaConnectionAdapter_1 = require("../solana/SolanaConnectionAdapter");
const entities_1 = require("../../domain/entities");
let InvestorRepositoryImpl = class InvestorRepositoryImpl {
    solanaConnection;
    kycService;
    constructor(solanaConnection, kycService) {
        this.solanaConnection = solanaConnection;
        this.kycService = kycService;
    }
    async findByWallet(walletAddress) {
        try {
            const wallet = new web3_js_1.PublicKey(walletAddress);
            const connection = this.solanaConnection.getConnection();
            const accountInfo = await connection.getAccountInfo(wallet);
            if (!accountInfo)
                return null;
            const kycResult = await this.kycService.verifyKyc(walletAddress);
            return entities_1.InvestorEntity.fromKycResult(walletAddress, {
                status: kycResult.status,
                gatewayToken: kycResult.gatewayToken,
                expiresAt: kycResult.expiresAt,
            });
        }
        catch {
            return null;
        }
    }
    async getHoldings(walletAddress, propertyMints) {
        const holdings = [];
        const wallet = new web3_js_1.PublicKey(walletAddress);
        const connection = this.solanaConnection.getConnection();
        for (const mintAddress of propertyMints) {
            try {
                const mint = new web3_js_1.PublicKey(mintAddress);
                const ata = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, wallet, false, spl_token_2.TOKEN_2022_PROGRAM_ID, spl_token_2.ASSOCIATED_TOKEN_PROGRAM_ID);
                const accountInfo = await (0, spl_token_1.getAccount)(connection, ata, 'confirmed', spl_token_2.TOKEN_2022_PROGRAM_ID);
                if (accountInfo.amount > 0n) {
                    holdings.push({
                        propertyMint: mintAddress,
                        tokenAccount: ata.toString(),
                        balance: accountInfo.amount,
                        percentage: 0,
                    });
                }
            }
            catch {
                continue;
            }
        }
        return holdings;
    }
    async getKycStatus(walletAddress) {
        const result = await this.kycService.verifyKyc(walletAddress);
        return result.status;
    }
    async isKycVerified(walletAddress) {
        const result = await this.kycService.verifyKyc(walletAddress);
        return result.isValid;
    }
    async findByProperty(_propertyMint) {
        console.log('[InvestorRepository] findByProperty requires token indexer service');
        return [];
    }
    async countByProperty(propertyMint) {
        const investors = await this.findByProperty(propertyMint);
        return investors.length;
    }
};
exports.InvestorRepositoryImpl = InvestorRepositoryImpl;
exports.InvestorRepositoryImpl = InvestorRepositoryImpl = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.SolanaConnection)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.KycService)),
    __metadata("design:paramtypes", [SolanaConnectionAdapter_1.SolanaConnectionAdapter, Object])
], InvestorRepositoryImpl);
//# sourceMappingURL=InvestorRepositoryImpl.js.map