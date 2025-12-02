import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configureContainer, container } from './shared/container/container';
import { createApiRoutes } from './interfaces/http/routes';
import { errorHandler, requestLogger } from './interfaces/http/middlewares';
import { Config } from './infrastructure/config/Config';
import { TOKENS } from './shared/container/tokens';

async function bootstrap(): Promise<void> {
  // Initialize DI container
  configureContainer();

  const config = container.resolve<Config>(TOKENS.Config);
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.server.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-wallet-address'],
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // API Routes
  app.use('/api/v1', createApiRoutes());

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
  app.use(errorHandler);

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
    console.log('  ║   Admin:                                         ║');
    console.log('  ║   • POST /api/v1/admin/properties (create)       ║');
    console.log('  ║   • POST /api/v1/admin/mint (mint tokens)        ║');
    console.log('  ║   • POST /api/v1/admin/revenue (deposit)         ║');
    console.log('  ║                                                  ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('\n');
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
