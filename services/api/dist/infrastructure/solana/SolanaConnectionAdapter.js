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
exports.SolanaConnectionAdapter = void 0;
const tsyringe_1 = require("tsyringe");
const web3_js_1 = require("@solana/web3.js");
const tokens_1 = require("../../shared/container/tokens");
const Config_1 = require("../config/Config");
let SolanaConnectionAdapter = class SolanaConnectionAdapter {
    config;
    connection;
    constructor(config) {
        this.config = config;
        this.connection = new web3_js_1.Connection(config.solana.rpcUrl, {
            commitment: config.solana.commitment,
            wsEndpoint: config.solana.wsUrl,
        });
    }
    getConnection() {
        return this.connection;
    }
    async getBalance(publicKey) {
        return this.connection.getBalance(publicKey);
    }
    async getAccountInfo(publicKey) {
        return this.connection.getAccountInfo(publicKey);
    }
    async sendTransaction(transaction, signers) {
        return (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, signers, {
            commitment: this.config.solana.commitment,
        });
    }
    async requestAirdrop(publicKey, lamports) {
        if (this.config.isProduction()) {
            throw new Error('Airdrop not available on mainnet');
        }
        const signature = await this.connection.requestAirdrop(publicKey, lamports);
        await this.connection.confirmTransaction(signature, this.config.solana.commitment);
        return signature;
    }
    getProgramId() {
        return new web3_js_1.PublicKey(this.config.solana.programId);
    }
};
exports.SolanaConnectionAdapter = SolanaConnectionAdapter;
exports.SolanaConnectionAdapter = SolanaConnectionAdapter = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __metadata("design:paramtypes", [Config_1.Config])
], SolanaConnectionAdapter);
//# sourceMappingURL=SolanaConnectionAdapter.js.map