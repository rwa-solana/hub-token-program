import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { GetInvestorPortfolioUseCase } from '../../../application/use-cases/GetInvestorPortfolioUseCase';
import { GetClaimableRevenueUseCase } from '../../../application/use-cases/GetClaimableRevenueUseCase';

@injectable()
export class InvestorController {
  constructor(
    private getInvestorPortfolioUseCase: GetInvestorPortfolioUseCase,
    private getClaimableRevenueUseCase: GetClaimableRevenueUseCase
  ) {}

  async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      const portfolio = await this.getInvestorPortfolioUseCase.execute(wallet);

      res.json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClaimable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      const claimable = await this.getClaimableRevenueUseCase.execute(wallet);

      res.json({
        success: true,
        data: claimable,
      });
    } catch (error) {
      next(error);
    }
  }
}
