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
exports.RevenueRepositoryImpl = void 0;
const tsyringe_1 = require("tsyringe");
const web3_js_1 = require("@solana/web3.js");
const tokens_1 = require("../../shared/container/tokens");
const SolanaProgramAdapter_1 = require("../solana/SolanaProgramAdapter");
const SolanaConnectionAdapter_1 = require("../solana/SolanaConnectionAdapter");
const entities_1 = require("../../domain/entities");
let RevenueRepositoryImpl = class RevenueRepositoryImpl {
    programAdapter;
    solanaConnection;
    constructor(programAdapter, solanaConnection) {
        this.programAdapter = programAdapter;
        this.solanaConnection = solanaConnection;
    }
    async findEpochByProperty(propertyMint, epochNumber) {
        try {
            const mint = new web3_js_1.PublicKey(propertyMint);
            const [propertyStatePda] = this.programAdapter.derivePropertyStatePda(mint);
            const data = await this.programAdapter.fetchRevenueEpoch(propertyStatePda, epochNumber);
            if (!data)
                return null;
            const [epochPda] = this.programAdapter.deriveRevenueEpochPda(propertyStatePda, epochNumber);
            return entities_1.RevenueEpochEntity.fromOnChain(data, epochPda.toString(), propertyMint);
        }
        catch {
            return null;
        }
    }
    async findCurrentEpoch(propertyMint) {
        const mint = new web3_js_1.PublicKey(propertyMint);
        const propertyState = await this.programAdapter.fetchPropertyState(mint);
        if (!propertyState)
            return null;
        const currentEpoch = propertyState.currentEpoch || 0;
        return this.findEpochByProperty(propertyMint, currentEpoch);
    }
    async findAllEpochsByProperty(propertyMint) {
        const mint = new web3_js_1.PublicKey(propertyMint);
        const propertyState = await this.programAdapter.fetchPropertyState(mint);
        if (!propertyState)
            return [];
        const currentEpoch = propertyState.currentEpoch || 0;
        const epochs = [];
        for (let i = 0; i <= currentEpoch; i++) {
            const epoch = await this.findEpochByProperty(propertyMint, i);
            if (epoch) {
                epochs.push(epoch);
            }
        }
        return epochs;
    }
    async findClaimRecord(epochAccount, investorWallet) {
        try {
            const epoch = new web3_js_1.PublicKey(epochAccount);
            const investor = new web3_js_1.PublicKey(investorWallet);
            const [claimPda] = this.programAdapter.deriveClaimRecordPda(epoch, investor);
            const connection = this.solanaConnection.getConnection();
            const accountInfo = await connection.getAccountInfo(claimPda);
            if (!accountInfo)
                return null;
            // Parse claim record data
            // Structure: discriminator (8) + epoch (32) + investor (32) + claimed (1) + amount (8) + timestamp (8)
            const data = accountInfo.data;
            if (data.length < 89)
                return null;
            const claimed = data[72] === 1;
            const amountClaimed = data.readBigUInt64LE(73);
            const claimedAt = data.readBigInt64LE(81);
            return new entities_1.ClaimRecordEntity({
                account: claimPda.toString(),
                epochAccount,
                investorWallet,
                amountClaimed,
                claimed,
                claimedAt: claimedAt > 0n ? new Date(Number(claimedAt) * 1000) : null,
            });
        }
        catch {
            return null;
        }
    }
    async getClaimableAmount(epochAccount, investorWallet) {
        const claimRecord = await this.findClaimRecord(epochAccount, investorWallet);
        if (claimRecord?.claimed) {
            return 0n;
        }
        // Calculate claimable based on token holdings
        // This requires knowing the investor's balance at epoch snapshot
        // In production, use stored snapshot data
        return 0n;
    }
    async getTotalDistributed(propertyMint) {
        const epochs = await this.findAllEpochsByProperty(propertyMint);
        return epochs.reduce((total, epoch) => total + epoch.totalClaimed, 0n);
    }
    async getUnclaimedAmount(propertyMint) {
        const epochs = await this.findAllEpochsByProperty(propertyMint);
        return epochs.reduce((total, epoch) => {
            const unclaimed = epoch.totalAmount - epoch.totalClaimed;
            return total + unclaimed;
        }, 0n);
    }
};
exports.RevenueRepositoryImpl = RevenueRepositoryImpl;
exports.RevenueRepositoryImpl = RevenueRepositoryImpl = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.SolanaProgram)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.SolanaConnection)),
    __metadata("design:paramtypes", [SolanaProgramAdapter_1.SolanaProgramAdapter,
        SolanaConnectionAdapter_1.SolanaConnectionAdapter])
], RevenueRepositoryImpl);
//# sourceMappingURL=RevenueRepositoryImpl.js.map