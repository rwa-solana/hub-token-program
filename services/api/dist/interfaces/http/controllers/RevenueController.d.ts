import { Request, Response, NextFunction } from 'express';
import { GetRevenueHistoryUseCase } from '../../../application/use-cases/GetRevenueHistoryUseCase';
export declare class RevenueController {
    private getRevenueHistoryUseCase;
    constructor(getRevenueHistoryUseCase: GetRevenueHistoryUseCase);
    getHistoryByProperty(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=RevenueController.d.ts.map