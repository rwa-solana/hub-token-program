import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { GetRevenueHistoryUseCase } from '../../../application/use-cases/GetRevenueHistoryUseCase';

@injectable()
export class RevenueController {
  constructor(
    private getRevenueHistoryUseCase: GetRevenueHistoryUseCase
  ) {}

  async getHistoryByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;

      const history = await this.getRevenueHistoryUseCase.execute(mint);

      if (!history) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
