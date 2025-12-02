import { Request, Response, NextFunction } from 'express';
import { GetPropertiesUseCase } from '../../../application/use-cases/GetPropertiesUseCase';
import { GetPropertyByMintUseCase } from '../../../application/use-cases/GetPropertyByMintUseCase';
export declare class PropertyController {
    private getPropertiesUseCase;
    private getPropertyByMintUseCase;
    constructor(getPropertiesUseCase: GetPropertiesUseCase, getPropertyByMintUseCase: GetPropertyByMintUseCase);
    getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    getByMint(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=PropertyController.d.ts.map