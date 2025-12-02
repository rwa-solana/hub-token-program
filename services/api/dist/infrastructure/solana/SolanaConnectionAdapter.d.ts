import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Config } from '../config/Config';
export declare class SolanaConnectionAdapter {
    private config;
    private connection;
    constructor(config: Config);
    getConnection(): Connection;
    getBalance(publicKey: PublicKey): Promise<number>;
    getAccountInfo(publicKey: PublicKey): Promise<import("@solana/web3.js").AccountInfo<Buffer<ArrayBufferLike>> | null>;
    sendTransaction(transaction: Transaction, signers: Keypair[]): Promise<string>;
    requestAirdrop(publicKey: PublicKey, lamports: number): Promise<string>;
    getProgramId(): PublicKey;
}
//# sourceMappingURL=SolanaConnectionAdapter.d.ts.map