"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const container_1 = require("./shared/container/container");
const routes_1 = require("./interfaces/http/routes");
const middlewares_1 = require("./interfaces/http/middlewares");
const tokens_1 = require("./shared/container/tokens");
async function bootstrap() {
    // Initialize DI container
    (0, container_1.configureContainer)();
    const config = container_1.container.resolve(tokens_1.TOKENS.Config);
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS
    app.use((0, cors_1.default)({
        origin: config.server.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    // Body parsing
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging
    app.use(middlewares_1.requestLogger);
    // API Routes
    app.use('/api/v1', (0, routes_1.createApiRoutes)());
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            name: 'Hub Token API',
            version: '1.0.0',
            description: 'Real Estate Tokenization Platform API',
            docs: '/api/v1',
            health: '/api/v1/health',
        });
    });
    // Error handling
    app.use(middlewares_1.errorHandler);
    // Start server
    const { port, host } = config.server;
    app.listen(port, host, () => {
        console.log('\n');
        console.log('  ╔══════════════════════════════════════════════════╗');
        console.log('  ║                                                  ║');
        console.log('  ║   🏠  Hub Token API Server                       ║');
        console.log('  ║   Real Estate Tokenization Platform              ║');
        console.log('  ║                                                  ║');
        console.log('  ╠══════════════════════════════════════════════════╣');
        console.log(`  ║   🌐 Server:  http://${host}:${port}               `);
        console.log(`  ║   🔗 Network: ${config.solana.network.padEnd(32)}`);
        console.log(`  ║   📡 RPC:     ${config.solana.rpcUrl.substring(0, 30).padEnd(32)}`);
        console.log('  ║                                                  ║');
        console.log('  ║   Endpoints:                                     ║');
        console.log('  ║   • GET  /api/v1/properties                      ║');
        console.log('  ║   • GET  /api/v1/properties/:mint                ║');
        console.log('  ║   • GET  /api/v1/kyc/verify/:wallet              ║');
        console.log('  ║   • POST /api/v1/kyc/attestation                 ║');
        console.log('  ║   • GET  /api/v1/investors/:wallet/portfolio     ║');
        console.log('  ║   • GET  /api/v1/investors/:wallet/claimable     ║');
        console.log('  ║   • GET  /api/v1/revenue/property/:mint          ║');
        console.log('  ║   • GET  /api/v1/ipfs/status                     ║');
        console.log('  ║   • POST /api/v1/ipfs/upload/image (admin)       ║');
        console.log('  ║   • POST /api/v1/ipfs/metadata (admin)           ║');
        console.log('  ║                                                  ║');
        console.log('  ╚══════════════════════════════════════════════════╝');
        console.log('\n');
    });
}
bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map