import { injectable } from 'tsyringe';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Civic Gatekeeper Networks
 * These are the available Civic Pass verification networks
 */
export const CIVIC_GATEKEEPER_NETWORKS = {
  // Uniqueness verification (proof of human)
  uniqueness: 'tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf',
  // ID Verification (full KYC/AML) - REQUIRED for securities
  idVerification: 'bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw',
  // CAPTCHA verification (basic bot protection)
  captcha: 'ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6',
} as const;

/**
 * Civic Gateway Program ID (mainnet/devnet)
 */
export const CIVIC_GATEWAY_PROGRAM_ID = 'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs';

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
  indexer: {
    url: string;
  };
  hubCredential: {
    apiUrl: string;
    programId: string;
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

@injectable()
export class Config implements IConfig {
  solana: IConfig['solana'];
  server: IConfig['server'];
  indexer: IConfig['indexer'];
  hubCredential: IConfig['hubCredential'];
  civic: IConfig['civic'];
  pinata: IConfig['pinata'];
  admin: IConfig['admin'];

  constructor() {
    this.solana = {
      rpcUrl: process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899',
      wsUrl: process.env.SOLANA_WS_URL || 'ws://127.0.0.1:8900',
      network: (process.env.SOLANA_NETWORK as IConfig['solana']['network']) || 'devnet',
      programId: process.env.PROGRAM_ID || 'Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z',
      commitment: (process.env.SOLANA_COMMITMENT as IConfig['solana']['commitment']) || 'confirmed',
    };

    this.server = {
      port: parseInt(process.env.PORT || '3001', 10),
      host: process.env.HOST || '0.0.0.0',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    };

    this.indexer = {
      url: process.env.INDEXER_URL || 'http://localhost:8080',
    };

    this.hubCredential = {
      apiUrl: process.env.HUB_CREDENTIAL_API_URL || 'http://localhost:3001',
      programId: process.env.HUB_CREDENTIAL_PROGRAM_ID || 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt',
    };

    this.civic = {
      gatewayProgramId: process.env.CIVIC_GATEWAY_PROGRAM_ID || CIVIC_GATEWAY_PROGRAM_ID,
      // Default to ID Verification for RWA/Securities compliance
      gatekeeperNetwork: process.env.CIVIC_GATEKEEPER_NETWORK || CIVIC_GATEKEEPER_NETWORKS.idVerification,
    };

    this.pinata = {
      jwt: process.env.PINATA_JWT || '',
      apiKey: process.env.PINATA_API_KEY || '',
      secretKey: process.env.PINATA_SECRET_KEY || '',
      gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
    };

    this.admin = {
      // Admin wallet must match the keypair in ~/.config/solana/id.json for signing transactions
      walletAddress: process.env.ADMIN_WALLET || 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw',
    };
  }

  isDevelopment(): boolean {
    return this.solana.network === 'devnet' || this.solana.network === 'localnet';
  }

  isProduction(): boolean {
    return this.solana.network === 'mainnet-beta';
  }
}
