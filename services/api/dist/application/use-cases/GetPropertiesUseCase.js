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
exports.GetPropertiesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const tokens_1 = require("../../shared/container/tokens");
let GetPropertiesUseCase = class GetPropertiesUseCase {
    propertyRepository;
    constructor(propertyRepository) {
        this.propertyRepository = propertyRepository;
    }
    async execute(input) {
        const properties = await this.propertyRepository.findAll(input?.filter);
        return properties.map((p) => this.toDTO(p));
    }
    toDTO(property) {
        const availableSupply = property.totalSupply - property.circulatingSupply;
        const valuePerToken = property.totalSupply > 0n
            ? property.details.totalValueUsd / Number(property.totalSupply)
            : 0;
        return {
            mint: property.mint,
            name: property.name,
            symbol: property.symbol,
            authority: property.authority,
            status: property.status,
            totalSupply: property.totalSupply.toString(),
            circulatingSupply: property.circulatingSupply.toString(),
            availableSupply: availableSupply.toString(),
            decimals: property.decimals,
            details: {
                propertyType: property.details.propertyType,
                location: property.details.location,
                totalValueUsd: property.details.totalValueUsd,
                valuePerToken,
                annualYieldPercent: property.details.annualYieldPercent,
            },
            currentEpoch: property.currentEpoch,
            createdAt: property.createdAt.toISOString(),
        };
    }
};
exports.GetPropertiesUseCase = GetPropertiesUseCase;
exports.GetPropertiesUseCase = GetPropertiesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.PropertyRepository)),
    __metadata("design:paramtypes", [Object])
], GetPropertiesUseCase);
//# sourceMappingURL=GetPropertiesUseCase.js.map