"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaProgramAdapter = void 0;
const tsyringe_1 = require("tsyringe");
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const tokens_1 = require("../../shared/container/tokens");
const Config_1 = require("../config/Config");
const SolanaConnectionAdapter_1 = require("./SolanaConnectionAdapter");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadIdl() {
    const possiblePaths = [
        path.join(process.cwd(), 'idl', 'hub_token_program.json'),
        path.join(__dirname, '../../../../target/idl/hub_token_program.json'),
        path.join(process.cwd(), '../../target/idl/hub_token_program.json'),
    ];
    for (const idlPath of possiblePaths) {
        try {
            if (fs.existsSync(idlPath)) {
                const idlContent = fs.readFileSync(idlPath, 'utf-8');
                console.log(`[IDL] Loaded from: ${idlPath}`);
                return JSON.parse(idlContent);
            }
        }
        catch {
            // Continue to next path
        }
    }
    console.warn('[IDL] Could not load IDL file');
    return null;
}
let SolanaProgramAdapter = class SolanaProgramAdapter {
    config;
    solanaConnection;
    program = null;
    provider;
    programId;
    constructor(config, solanaConnection) {
        this.config = config;
        this.solanaConnection = solanaConnection;
        const connection = solanaConnection.getConnection();
        this.programId = new web3_js_1.PublicKey(config.solana.programId);
        const dummyWallet = {
            publicKey: web3_js_1.PublicKey.default,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.provider = new anchor_1.AnchorProvider(connection, dummyWallet, {
            commitment: config.solana.commitment,
        });
        try {
            const idl = loadIdl();
            if (idl) {
                this.program = new anchor_1.Program(idl, this.provider);
            }
        }
        catch (e) {
            console.error('[SolanaProgramAdapter] Failed to initialize program:', e);
        }
    }
    getProgram() {
        return this.program;
    }
    isInitialized() {
        return this.program !== null;
    }
    getProgramId() {
        return this.programId;
    }
    derivePropertyStatePda(mint) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('property'), mint.toBuffer()], this.programId);
    }
    deriveExtraAccountMetasPda(mint) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('extra-account-metas'), mint.toBuffer()], this.programId);
    }
    deriveRevenueEpochPda(propertyState, epochNumber) {
        const epochBuffer = Buffer.alloc(8);
        epochBuffer.writeBigUInt64LE(BigInt(epochNumber));
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('revenue_epoch'), propertyState.toBuffer(), epochBuffer], this.programId);
    }
    deriveClaimRecordPda(revenueEpoch, investor) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('claim_record'), revenueEpoch.toBuffer(), investor.toBuffer()], this.programId);
    }
    deriveRevenueVaultPda(revenueEpoch) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('revenue_vault'), revenueEpoch.toBuffer()], this.programId);
    }
    async fetchPropertyState(mint) {
        if (!this.program)
            return null;
        const [pda] = this.derivePropertyStatePda(mint);
        try {
            return await this.program.account.propertyState.fetch(pda);
        }
        catch {
            return null;
        }
    }
    async fetchAllProperties() {
        if (!this.program)
            return [];
        try {
            return await this.program.account.propertyState.all();
        }
        catch {
            return [];
        }
    }
    async fetchRevenueEpoch(propertyState, epochNumber) {
        if (!this.program)
            return null;
        const [pda] = this.deriveRevenueEpochPda(propertyState, epochNumber);
        try {
            return await this.program.account.revenueEpoch.fetch(pda);
        }
        catch {
            return null;
        }
    }
    getAssociatedTokenAddress(mint, owner) {
        return (0, spl_token_1.getAssociatedTokenAddressSync)(mint, owner, false, spl_token_1.TOKEN_2022_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    }
};
exports.SolanaProgramAdapter = SolanaProgramAdapter;
exports.SolanaProgramAdapter = SolanaProgramAdapter = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(tokens_1.TOKENS.Config)),
    __param(1, (0, tsyringe_1.inject)(tokens_1.TOKENS.SolanaConnection)),
    __metadata("design:paramtypes", [Config_1.Config,
        SolanaConnectionAdapter_1.SolanaConnectionAdapter])
], SolanaProgramAdapter);
//# sourceMappingURL=SolanaProgramAdapter.js.map