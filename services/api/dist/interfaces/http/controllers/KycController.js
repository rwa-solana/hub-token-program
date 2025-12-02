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
exports.KycController = void 0;
const tsyringe_1 = require("tsyringe");
const VerifyKycUseCase_1 = require("../../../application/use-cases/VerifyKycUseCase");
const CreateKycAttestationUseCase_1 = require("../../../application/use-cases/CreateKycAttestationUseCase");
const tokens_1 = require("../../../shared/container/tokens");
const Config_1 = require("../../../infrastructure/config/Config");
let KycController = class KycController {
    verifyKycUseCase;
    createKycAttestationUseCase;
    kycService;
    config;
    constructor(verifyKycUseCase, createKycAttestationUseCase, kycService, config) {
        this.verifyKycUseCase = verifyKycUseCase;
        this.createKycAttestationUseCase = createKycAttestationUseCase;
        this.kycService = kycService;
        this.config = config;
    }
    /**
     * Verify Civic Pass status for a wallet
     * GET /kyc/verify/:wallet
     */
    async verify(req, res, next) {
        try {
            const { wallet } = req.params;
            const result = await this.verifyKycUseCase.execute(wallet);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get Gateway Token PDA for a wallet
     * GET /kyc/gateway-token/:wallet
     */
    async getGatewayTokenPda(req, res, next) {
        try {
            const { wallet } = req.params;
            const gatewayTokenPda = this.kycService.getGatewayTokenPda(wallet);
            res.json({
                success: true,
                data: {
                    walletAddress: wallet,
                    gatewayTokenPda,
                    gatekeeperNetwork: this.config.civic.gatekeeperNetwork,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get Civic configuration info
     * GET /kyc/config
     */
    async getConfig(req, res, next) {
        try {
            res.json({
                success: true,
                data: {
                    gatewayProgramId: this.config.civic.gatewayProgramId,
                    gatekeeperNetwork: this.config.civic.gatekeeperNetwork,
                    networkType: 'idVerification',
                    availableNetworks: {
                        uniqueness: Config_1.CIVIC_GATEKEEPER_NETWORKS.uniqueness,
                        idVerification: Config_1.CIVIC_GATEKEEPER_NETWORKS.idVerification,
                        captcha: Config_1.CIVIC_GATEKEEPER_NETWORKS.captcha,
                    },
                    documentation: 'https://docs.civic.com',
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * @deprecated Use Civic frontend to create Gateway Tokens
     * POST /kyc/attestation
     */
    async createAttestation(req, res, next) {
        try {
            const { walletAddress, provider, expiresInDays } = req.body;
            if (!walletAddress) {
                res.status(400).json({
                    success: false,
                    error: 'walletAddress is required',
                });
                return;
            }
            const result = await this.createKycAttestationUseCase.execute({
                walletAddress,
                provider,
                expiresInDays,
            });
            res.status(201).json({
                success: true,
                data: result,
                deprecation: 'This endpoint is deprecated. Users should obtain Civic Pass through the Civic frontend flow.',
            });
        }
        catch (error) {
            next(error);
        }
    }
};
exports.KycController = KycController;
exports.KycController = KycController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(2, (0, tsyringe_1.inject)(tokens_1.TOKENS.KycService)),
    __param(3, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __metadata("design:paramtypes", [VerifyKycUseCase_1.VerifyKycUseCase,
        CreateKycAttestationUseCase_1.CreateKycAttestationUseCase, Object, Config_1.Config])
], KycController);
//# sourceMappingURL=KycController.js.map