import { Request, Response, NextFunction } from 'express';
import { IpfsService } from '../../../infrastructure/ipfs/IpfsService';
import { Config } from '../../../infrastructure/config/Config';
export declare class IpfsController {
    private ipfsService;
    private config;
    constructor(ipfsService: IpfsService, config: Config);
    private isAdmin;
    getStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGatewayUrl(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    uploadImage(req: Request, res: Response, next: NextFunction): Promise<void>;
    uploadImages(req: Request, res: Response, next: NextFunction): Promise<void>;
    createMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    unpin(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=IpfsController.d.ts.map