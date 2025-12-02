import { Request, Response, NextFunction } from 'express';
import { GetInvestorPortfolioUseCase } from '../../../application/use-cases/GetInvestorPortfolioUseCase';
import { GetClaimableRevenueUseCase } from '../../../application/use-cases/GetClaimableRevenueUseCase';
export declare class InvestorController {
    private getInvestorPortfolioUseCase;
    private getClaimableRevenueUseCase;
    constructor(getInvestorPortfolioUseCase: GetInvestorPortfolioUseCase, getClaimableRevenueUseCase: GetClaimableRevenueUseCase);
    getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void>;
    getClaimable(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=InvestorController.d.ts.map