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
exports.PropertyRepositoryImpl = void 0;
const tsyringe_1 = require("tsyringe");
const web3_js_1 = require("@solana/web3.js");
const tokens_1 = require("../../shared/container/tokens");
const SolanaProgramAdapter_1 = require("../solana/SolanaProgramAdapter");
const entities_1 = require("../../domain/entities");
let PropertyRepositoryImpl = class PropertyRepositoryImpl {
    programAdapter;
    constructor(programAdapter) {
        this.programAdapter = programAdapter;
    }
    async findByMint(mintAddress) {
        try {
            const mint = new web3_js_1.PublicKey(mintAddress);
            const data = await this.programAdapter.fetchPropertyState(mint);
            if (!data)
                return null;
            return entities_1.PropertyEntity.fromOnChain(data, mintAddress);
        }
        catch {
            return null;
        }
    }
    async findAll(filter) {
        const allProperties = await this.programAdapter.fetchAllProperties();
        let properties = allProperties.map((acc) => entities_1.PropertyEntity.fromOnChain(acc.account, acc.publicKey.toString()));
        if (filter?.status) {
            properties = properties.filter((p) => p.status === filter.status);
        }
        if (filter?.minValue) {
            properties = properties.filter((p) => p.details.totalValueUsd >= filter.minValue);
        }
        if (filter?.maxValue) {
            properties = properties.filter((p) => p.details.totalValueUsd <= filter.maxValue);
        }
        if (filter?.propertyType) {
            properties = properties.filter((p) => p.details.propertyType === filter.propertyType);
        }
        return properties;
    }
    async findByAuthority(authority) {
        const allProperties = await this.findAll();
        return allProperties.filter((p) => p.authority === authority);
    }
    async exists(mintAddress) {
        const property = await this.findByMint(mintAddress);
        return property !== null;
    }
    async getPropertyStatePda(mint) {
        const [pda] = this.programAdapter.derivePropertyStatePda(new web3_js_1.PublicKey(mint));
        return pda.toString();
    }
    async getCirculatingSupply(mintAddress) {
        const property = await this.findByMint(mintAddress);
        return property?.circulatingSupply ?? 0n;
    }
};
exports.PropertyRepositoryImpl = PropertyRepositoryImpl;
exports.PropertyRepositoryImpl = PropertyRepositoryImpl = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.SolanaProgram)),
    __metadata("design:paramtypes", [SolanaProgramAdapter_1.SolanaProgramAdapter])
], PropertyRepositoryImpl);
//# sourceMappingURL=PropertyRepositoryImpl.js.map