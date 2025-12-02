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
exports.GetRevenueHistoryUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const tokens_1 = require("../../shared/container/tokens");
let GetRevenueHistoryUseCase = class GetRevenueHistoryUseCase {
    revenueRepository;
    propertyRepository;
    constructor(revenueRepository, propertyRepository) {
        this.revenueRepository = revenueRepository;
        this.propertyRepository = propertyRepository;
    }
    async execute(propertyMint) {
        const property = await this.propertyRepository.findByMint(propertyMint);
        if (!property)
            return null;
        const epochs = await this.revenueRepository.findAllEpochsByProperty(propertyMint);
        const totalDistributed = await this.revenueRepository.getTotalDistributed(propertyMint);
        const totalUnclaimed = await this.revenueRepository.getUnclaimedAmount(propertyMint);
        return {
            propertyMint,
            propertyName: property.name,
            totalDistributed: totalDistributed.toString(),
            totalUnclaimed: totalUnclaimed.toString(),
            epochs: epochs.map(epoch => ({
                account: epoch.account,
                epochNumber: epoch.epochNumber,
                totalAmount: epoch.totalAmount.toString(),
                totalClaimed: epoch.totalClaimed.toString(),
                remainingAmount: (epoch.totalAmount - epoch.totalClaimed).toString(),
                status: epoch.status,
                distributedAt: epoch.distributedAt.toISOString(),
                expiresAt: epoch.expiresAt?.toISOString() ?? null,
            })),
        };
    }
};
exports.GetRevenueHistoryUseCase = GetRevenueHistoryUseCase;
exports.GetRevenueHistoryUseCase = GetRevenueHistoryUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.RevenueRepository)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.PropertyRepository)),
    __metadata("design:paramtypes", [Object, Object])
], GetRevenueHistoryUseCase);
//# sourceMappingURL=GetRevenueHistoryUseCase.js.map