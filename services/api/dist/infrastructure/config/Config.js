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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.CIVIC_GATEWAY_PROGRAM_ID = exports.CIVIC_GATEKEEPER_NETWORKS = void 0;
const tsyringe_1 = require("tsyringe");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Civic Gatekeeper Networks
 * These are the available Civic Pass verification networks
 */
exports.CIVIC_GATEKEEPER_NETWORKS = {
    // Uniqueness verification (proof of human)
    uniqueness: 'tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf',
    // ID Verification (full KYC/AML) - REQUIRED for securities
    idVerification: 'bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw',
    // CAPTCHA verification (basic bot protection)
    captcha: 'ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6',
};
/**
 * Civic Gateway Program ID (mainnet/devnet)
 */
exports.CIVIC_GATEWAY_PROGRAM_ID = 'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs';
let Config = class Config {
    solana;
    server;
    civic;
    pinata;
    admin;
    constructor() {
        this.solana = {
            rpcUrl: process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899',
            wsUrl: process.env.SOLANA_WS_URL || 'ws://127.0.0.1:8900',
            network: process.env.SOLANA_NETWORK || 'devnet',
            programId: process.env.PROGRAM_ID || 'Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z',
            commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
        };
        this.server = {
            port: parseInt(process.env.PORT || '3001', 10),
            host: process.env.HOST || '0.0.0.0',
            corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
        };
        this.civic = {
            gatewayProgramId: process.env.CIVIC_GATEWAY_PROGRAM_ID || exports.CIVIC_GATEWAY_PROGRAM_ID,
            // Default to ID Verification for RWA/Securities compliance
            gatekeeperNetwork: process.env.CIVIC_GATEKEEPER_NETWORK || exports.CIVIC_GATEKEEPER_NETWORKS.idVerification,
        };
        this.pinata = {
            jwt: process.env.PINATA_JWT || '',
            apiKey: process.env.PINATA_API_KEY || '',
            secretKey: process.env.PINATA_SECRET_KEY || '',
            gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
        };
        this.admin = {
            walletAddress: process.env.ADMIN_WALLET || '7XxWTXMiZzEaG54aXQtfsoA78F6CDScpYAjuMHBUbKQ7',
        };
    }
    isDevelopment() {
        return this.solana.network === 'devnet' || this.solana.network === 'localnet';
    }
    isProduction() {
        return this.solana.network === 'mainnet-beta';
    }
};
exports.Config = Config;
exports.Config = Config = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], Config);
//# sourceMappingURL=Config.js.map