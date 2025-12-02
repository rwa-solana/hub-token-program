import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { GetPropertiesUseCase } from '../../../application/use-cases/GetPropertiesUseCase';
import { GetPropertyByMintUseCase } from '../../../application/use-cases/GetPropertyByMintUseCase';
import { PropertyStatus } from '../../../domain/entities';

@injectable()
export class PropertyController {
  constructor(
    private getPropertiesUseCase: GetPropertiesUseCase,
    private getPropertyByMintUseCase: GetPropertyByMintUseCase
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, minValue, maxValue, propertyType } = req.query;

      const filter = {
        status: status as PropertyStatus | undefined,
        minValue: minValue ? Number(minValue) : undefined,
        maxValue: maxValue ? Number(maxValue) : undefined,
        propertyType: propertyType as string | undefined,
      };

      const properties = await this.getPropertiesUseCase.execute({ filter });

      res.json({
        success: true,
        data: properties,
        count: properties.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByMint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;

      const property = await this.getPropertyByMintUseCase.execute(mint);

      if (!property) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }
}
