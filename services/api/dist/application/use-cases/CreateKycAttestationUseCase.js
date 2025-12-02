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
exports.CreateKycAttestationUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const tokens_1 = require("../../shared/container/tokens");
const Config_1 = require("../../infrastructure/config/Config");
/**
 * @deprecated Direct attestation creation is not supported with Civic Gateway.
 * Users should complete KYC verification through Civic's frontend flow.
 * This use case now only returns the expected Gateway Token PDA.
 */
let CreateKycAttestationUseCase = class CreateKycAttestationUseCase {
    kycService;
    config;
    constructor(kycService, config) {
        this.kycService = kycService;
        this.config = config;
    }
    async execute(input) {
        if (this.config.isProduction()) {
            throw new Error('Cannot create attestations on mainnet. Users must complete KYC through Civic Pass.');
        }
        const result = await this.kycService.createAttestation({
            walletAddress: input.walletAddress,
            provider: input.provider,
            expiresInDays: input.expiresInDays,
        });
        return {
            walletAddress: input.walletAddress,
            gatewayTokenPda: result.attestationAccount,
            signature: result.signature,
            message: 'For devnet testing, please obtain a Civic Pass through the Civic frontend. This endpoint returns the expected Gateway Token PDA address.',
        };
    }
};
exports.CreateKycAttestationUseCase = CreateKycAttestationUseCase;
exports.CreateKycAttestationUseCase = CreateKycAttestationUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.KycService)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __metadata("design:paramtypes", [Object, Config_1.Config])
], CreateKycAttestationUseCase);
//# sourceMappingURL=CreateKycAttestationUseCase.js.map