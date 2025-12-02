import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../../infrastructure/solana/AdminService';
import { TOKENS } from '../../../shared/container/tokens';

@injectable()
export class InvestController {
  constructor(
    @inject(TOKENS.AdminService) private adminService: AdminService
  ) {}

  async invest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Investment service not initialized. Please try again later.',
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

      console.log(`[InvestController] Processing investment:`);
      console.log(`  - Property Mint: ${propertyMint}`);
      console.log(`  - Investor Wallet: ${investorWallet}`);
      console.log(`  - Amount: ${tokenAmount} tokens`);

      // Use the existing mintTokens function which already:
      // 1. Verifies KYC via Hub Credential API
      // 2. Derives PDAs
      // 3. Mints tokens with on-chain KYC verification
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
        message: 'Investment successful! Tokens have been minted to your wallet.',
      });
    } catch (error: any) {
      console.error('[InvestController] invest error:', error);

      // Determine appropriate status code based on error type
      let statusCode = 500;
      let errorMessage = error.message || 'Investment failed';

      if (error.message?.includes('KYC') || error.message?.includes('credential')) {
        statusCode = 403;
        errorMessage = 'KYC verification required. Please complete identity verification first.';
      } else if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        statusCode = 404;
      } else if (error.message?.includes('ExceedsMaxSupply')) {
        statusCode = 400;
        errorMessage = 'Not enough tokens available for this investment.';
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
      });
    }
  }
}
