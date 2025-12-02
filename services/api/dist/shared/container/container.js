"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
exports.configureContainer = configureContainer;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
Object.defineProperty(exports, "container", { enumerable: true, get: function () { return tsyringe_1.container; } });
const tokens_1 = require("./tokens");
// Infrastructure imports
const SolanaConnectionAdapter_1 = require("../../infrastructure/solana/SolanaConnectionAdapter");
const SolanaProgramAdapter_1 = require("../../infrastructure/solana/SolanaProgramAdapter");
const KycServiceAdapter_1 = require("../../infrastructure/kyc/KycServiceAdapter");
const IpfsService_1 = require("../../infrastructure/ipfs/IpfsService");
const Logger_1 = require("../utils/Logger");
const Config_1 = require("../../infrastructure/config/Config");
// Repository implementations
const PropertyRepositoryImpl_1 = require("../../infrastructure/repositories/PropertyRepositoryImpl");
const InvestorRepositoryImpl_1 = require("../../infrastructure/repositories/InvestorRepositoryImpl");
const RevenueRepositoryImpl_1 = require("../../infrastructure/repositories/RevenueRepositoryImpl");
/**
 * Configure dependency injection container
 */
function configureContainer() {
    // Register Config
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.Config, Config_1.Config);
    // Register Logger
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.Logger, Logger_1.Logger);
    // Register Infrastructure
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.SolanaConnection, SolanaConnectionAdapter_1.SolanaConnectionAdapter);
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.SolanaProgram, SolanaProgramAdapter_1.SolanaProgramAdapter);
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.KycService, KycServiceAdapter_1.KycServiceAdapter);
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.IpfsService, IpfsService_1.IpfsService);
    // Register Repositories
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.PropertyRepository, PropertyRepositoryImpl_1.PropertyRepositoryImpl);
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.InvestorRepository, InvestorRepositoryImpl_1.InvestorRepositoryImpl);
    tsyringe_1.container.registerSingleton(tokens_1.TOKENS.RevenueRepository, RevenueRepositoryImpl_1.RevenueRepositoryImpl);
    // Use cases are auto-registered via @injectable() decorator
    return tsyringe_1.container;
}
//# sourceMappingURL=container.js.map