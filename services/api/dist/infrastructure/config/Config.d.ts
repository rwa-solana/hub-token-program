/**
 * Civic Gatekeeper Networks
 * These are the available Civic Pass verification networks
 */
export declare const CIVIC_GATEKEEPER_NETWORKS: {
    readonly uniqueness: "tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf";
    readonly idVerification: "bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw";
    readonly captcha: "ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6";
};
/**
 * Civic Gateway Program ID (mainnet/devnet)
 */
export declare const CIVIC_GATEWAY_PROGRAM_ID = "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs";
export interface IConfig {
    solana: {
        rpcUrl: string;
        wsUrl: string;
        network: 'devnet' | 'mainnet-beta' | 'localnet';
        programId: string;
        commitment: 'processed' | 'confirmed' | 'finalized';
    };
    server: {
        port: number;
        host: string;
        corsOrigins: string[];
    };
    civic: {
        gatewayProgramId: string;
        gatekeeperNetwork: string;
    };
    pinata: {
        jwt: string;
        apiKey: string;
        secretKey: string;
        gateway: string;
    };
    admin: {
        walletAddress: string;
    };
}
export declare class Config implements IConfig {
    solana: IConfig['solana'];
    server: IConfig['server'];
    civic: IConfig['civic'];
    pinata: IConfig['pinata'];
    admin: IConfig['admin'];
    constructor();
    isDevelopment(): boolean;
    isProduction(): boolean;
}
//# sourceMappingURL=Config.d.ts.map