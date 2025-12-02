import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { VerifyKycUseCase } from '../../../application/use-cases/VerifyKycUseCase';
import { CreateKycAttestationUseCase } from '../../../application/use-cases/CreateKycAttestationUseCase';
import { IKycService } from '../../../application/ports/IKycService';
import { TOKENS } from '../../../shared/container/tokens';
import { Config, CIVIC_GATEKEEPER_NETWORKS } from '../../../infrastructure/config/Config';

@injectable()
export class KycController {
  constructor(
    private verifyKycUseCase: VerifyKycUseCase,
    private createKycAttestationUseCase: CreateKycAttestationUseCase,
    @inject(TOKENS.KycService) private kycService: IKycService,
    @inject(TOKENS.Config) private config: Config
  ) {}

  /**
   * Verify Civic Pass status for a wallet
   * GET /kyc/verify/:wallet
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      const result = await this.verifyKycUseCase.execute(wallet);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Gateway Token PDA for a wallet
   * GET /kyc/gateway-token/:wallet
   */
  async getGatewayTokenPda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      const gatewayTokenPda = this.kycService.getGatewayTokenPda(wallet);

      res.json({
        success: true,
        data: {
          walletAddress: wallet,
          gatewayTokenPda,
          gatekeeperNetwork: this.config.civic.gatekeeperNetwork,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Civic configuration info
   * GET /kyc/config
   */
  async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          gatewayProgramId: this.config.civic.gatewayProgramId,
          gatekeeperNetwork: this.config.civic.gatekeeperNetwork,
          networkType: 'idVerification',
          availableNetworks: {
            uniqueness: CIVIC_GATEKEEPER_NETWORKS.uniqueness,
            idVerification: CIVIC_GATEKEEPER_NETWORKS.idVerification,
            captcha: CIVIC_GATEKEEPER_NETWORKS.captcha,
          },
          documentation: 'https://docs.civic.com',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @deprecated Use Civic frontend to create Gateway Tokens
   * POST /kyc/attestation
   */
  async createAttestation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { walletAddress, provider, expiresInDays } = req.body;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'walletAddress is required',
        });
        return;
      }

      const result = await this.createKycAttestationUseCase.execute({
        walletAddress,
        provider,
        expiresInDays,
      });

      res.status(201).json({
        success: true,
        data: result,
        deprecation: 'This endpoint is deprecated. Users should obtain Civic Pass through the Civic frontend flow.',
      });
    } catch (error) {
      next(error);
    }
  }
}
