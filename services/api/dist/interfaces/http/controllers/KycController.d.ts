import { Request, Response, NextFunction } from 'express';
import { VerifyKycUseCase } from '../../../application/use-cases/VerifyKycUseCase';
import { CreateKycAttestationUseCase } from '../../../application/use-cases/CreateKycAttestationUseCase';
import { IKycService } from '../../../application/ports/IKycService';
import { Config } from '../../../infrastructure/config/Config';
export declare class KycController {
    private verifyKycUseCase;
    private createKycAttestationUseCase;
    private kycService;
    private config;
    constructor(verifyKycUseCase: VerifyKycUseCase, createKycAttestationUseCase: CreateKycAttestationUseCase, kycService: IKycService, config: Config);
    /**
     * Verify Civic Pass status for a wallet
     * GET /kyc/verify/:wallet
     */
    verify(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get Gateway Token PDA for a wallet
     * GET /kyc/gateway-token/:wallet
     */
    getGatewayTokenPda(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get Civic configuration info
     * GET /kyc/config
     */
    getConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * @deprecated Use Civic frontend to create Gateway Tokens
     * POST /kyc/attestation
     */
    createAttestation(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=KycController.d.ts.map