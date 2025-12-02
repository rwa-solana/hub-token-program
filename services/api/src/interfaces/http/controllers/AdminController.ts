import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../../infrastructure/solana/AdminService';
import { Config } from '../../../infrastructure/config/Config';
import { TOKENS } from '../../../shared/container/tokens';

@injectable()
export class AdminController {
  constructor(
    @inject(TOKENS.Config) private config: Config,
    @inject(TOKENS.AdminService) private adminService: AdminService
  ) {}

  private verifyAdmin(req: Request, res: Response): boolean {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        error: 'Missing x-wallet-address header',
      });
      return false;
    }

    // Check against configured admin wallet
    if (walletAddress !== this.config.admin.walletAddress) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Not an admin wallet',
      });
      return false;
    }

    return true;
  }

  async createProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.verifyAdmin(req, res)) return;

      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Admin service not initialized. Check server logs.',
        });
        return;
      }

      const { name, symbol, totalSupply, details } = req.body;

      // Validate required fields
      if (!name || !symbol || !totalSupply || !details) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, symbol, totalSupply, details',
        });
        return;
      }

      const result = await this.adminService.createProperty({
        name,
        symbol,
        totalSupply,
        details: {
          propertyType: details.propertyType || 'residential',
          propertyAddress: details.propertyAddress || '',
          totalValueUsd: details.totalValueUsd || 0,
          annualYieldPercent: details.annualYieldPercent || 0,
          metadataUri: details.metadataUri || '',
        },
      });

      res.status(201).json({
        success: true,
        mint: result.mint,
        signature: result.signature,
        message: 'Property created successfully',
      });
    } catch (error: any) {
      console.error('[AdminController] createProperty error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create property',
      });
    }
  }

  async mintTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.verifyAdmin(req, res)) return;

      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Admin service not initialized. Check server logs.',
        });
        return;
      }

      const { propertyMint, investorWallet, amount } = req.body;

      // Validate required fields
      if (!propertyMint || !investorWallet || !amount) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: propertyMint, investorWallet, amount',
        });
        return;
      }

      // Validate amount is positive
      const tokenAmount = parseInt(amount, 10);
      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be a positive number',
        });
        return;
      }

      console.log(`[AdminController] Minting tokens:`);
      console.log(`  - Property Mint: ${propertyMint}`);
      console.log(`  - Investor Wallet: ${investorWallet}`);
      console.log(`  - Amount: ${tokenAmount}`);

      const result = await this.adminService.mintTokens({
        propertyMint,
        investorWallet,
        amount: tokenAmount,
      });

      res.status(200).json({
        success: true,
        data: {
          tokenAccount: result.tokenAccount,
          signature: result.signature,
          kycVerified: result.kycVerified,
          amount: tokenAmount,
          investorWallet,
          propertyMint,
        },
        message: 'Tokens minted successfully. KYC verification passed.',
      });
    } catch (error: any) {
      console.error('[AdminController] mintTokens error:', error);

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error.message?.includes('KYC') || error.message?.includes('credential')) {
        statusCode = 403; // Forbidden - KYC required
      } else if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to mint tokens',
      });
    }
  }

  async depositRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.verifyAdmin(req, res)) return;

      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Admin service not initialized. Check server logs.',
        });
        return;
      }

      const { propertyMint, epochNumber, amountSol } = req.body;

      // Validate required fields
      if (!propertyMint || epochNumber === undefined || !amountSol) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: propertyMint, epochNumber, amountSol',
        });
        return;
      }

      const result = await this.adminService.depositRevenue({
        propertyMint,
        epochNumber: parseInt(epochNumber, 10),
        amountSol: parseFloat(amountSol),
      });

      res.status(200).json({
        success: true,
        revenueVault: result.revenueVault,
        signature: result.signature,
        message: 'Revenue deposited successfully',
      });
    } catch (error: any) {
      console.error('[AdminController] depositRevenue error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to deposit revenue',
      });
    }
  }

  async togglePropertyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.verifyAdmin(req, res)) return;

      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Admin service not initialized. Check server logs.',
        });
        return;
      }

      const { mint } = req.params;

      if (!mint) {
        res.status(400).json({
          success: false,
          error: 'Missing mint parameter',
        });
        return;
      }

      const result = await this.adminService.togglePropertyStatus(mint);

      res.status(200).json({
        success: true,
        signature: result.signature,
        message: 'Property status toggled successfully',
      });
    } catch (error: any) {
      console.error('[AdminController] togglePropertyStatus error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to toggle property status',
      });
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminPublicKey = this.adminService.getAdminPublicKey();

      res.json({
        success: true,
        initialized: this.adminService.isInitialized(),
        adminWallet: adminPublicKey?.toString() || null,
        configuredAdmin: this.config.admin.walletAddress,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
