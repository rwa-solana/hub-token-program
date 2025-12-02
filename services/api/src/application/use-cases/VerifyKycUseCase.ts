import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IKycService, GatewayTokenState } from '../ports/IKycService';

export interface KycVerificationDTO {
  walletAddress: string;
  isVerified: boolean;
  status: string;
  gatewayToken: string | null;
  gatewayTokenState: GatewayTokenState | null;
  expiresAt: string | null;
  message: string;
}

@injectable()
export class VerifyKycUseCase {
  constructor(
    @inject(TOKENS.KycService) private kycService: IKycService
  ) {}

  async execute(walletAddress: string): Promise<KycVerificationDTO> {
    const result = await this.kycService.verifyKyc(walletAddress);

    return {
      walletAddress,
      isVerified: result.isValid,
      status: result.status,
      gatewayToken: result.gatewayToken,
      gatewayTokenState: result.gatewayTokenState,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      message: result.message,
    };
  }
}
