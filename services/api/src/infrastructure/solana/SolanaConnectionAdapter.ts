import { injectable, inject } from 'tsyringe';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../config/Config';

@injectable()
export class SolanaConnectionAdapter {
  private connection: Connection;

  constructor(@inject(TOKENS.Config) private config: Config) {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
      wsEndpoint: config.solana.wsUrl,
    });
  }

  getConnection(): Connection {
    return this.connection;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    return this.connection.getBalance(publicKey);
  }

  async getAccountInfo(publicKey: PublicKey) {
    return this.connection.getAccountInfo(publicKey);
  }

  async sendTransaction(
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string> {
    return sendAndConfirmTransaction(this.connection, transaction, signers, {
      commitment: this.config.solana.commitment,
    });
  }

  async requestAirdrop(publicKey: PublicKey, lamports: number): Promise<string> {
    if (this.config.isProduction()) {
      throw new Error('Airdrop not available on mainnet');
    }
    const signature = await this.connection.requestAirdrop(publicKey, lamports);
    await this.connection.confirmTransaction(signature, this.config.solana.commitment);
    return signature;
  }

  getProgramId(): PublicKey {
    return new PublicKey(this.config.solana.programId);
  }
}
