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
export declare class VerifyKycUseCase {
    private kycService;
    constructor(kycService: IKycService);
    execute(walletAddress: string): Promise<KycVerificationDTO>;
}
//# sourceMappingURL=VerifyKycUseCase.d.ts.map