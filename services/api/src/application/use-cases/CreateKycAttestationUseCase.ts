import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IKycService } from '../ports/IKycService';
import { Config } from '../../infrastructure/config/Config';

export interface CreateAttestationInput {
  walletAddress: string;
  provider?: string;
  expiresInDays?: number;
}

export interface CreateAttestationDTO {
  walletAddress: string;
  gatewayTokenPda: string;
  signature: string;
  message: string;
}

/**
 * @deprecated Direct attestation creation is not supported with Civic Gateway.
 * Users should complete KYC verification through Civic's frontend flow.
 * This use case now only returns the expected Gateway Token PDA.
 */
@injectable()
export class CreateKycAttestationUseCase {
  constructor(
    @inject(TOKENS.KycService) private kycService: IKycService,
    @inject(TOKENS.Config) private config: Config
  ) {}

  async execute(input: CreateAttestationInput): Promise<CreateAttestationDTO> {
    if (this.config.isProduction()) {
      throw new Error('Cannot create attestations on mainnet. Users must complete KYC through Civic Pass.');
    }

    const result = await this.kycService.createAttestation({
      walletAddress: input.walletAddress,
      provider: input.provider,
      expiresInDays: input.expiresInDays,
    });

    return {
      walletAddress: input.walletAddress,
      gatewayTokenPda: result.attestationAccount,
      signature: result.signature,
      message: 'For devnet testing, please obtain a Civic Pass through the Civic frontend. This endpoint returns the expected Gateway Token PDA address.',
    };
  }
}
