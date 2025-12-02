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
export declare class CreateKycAttestationUseCase {
    private kycService;
    private config;
    constructor(kycService: IKycService, config: Config);
    execute(input: CreateAttestationInput): Promise<CreateAttestationDTO>;
}
//# sourceMappingURL=CreateKycAttestationUseCase.d.ts.map