import { injectable, inject } from 'tsyringe';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../config/Config';
import { SolanaConnectionAdapter } from './SolanaConnectionAdapter';
import * as fs from 'fs';
import * as path from 'path';

function loadIdl(): Idl | null {
  const possiblePaths = [
    path.join(process.cwd(), 'idl', 'hub_token_program.json'),
    path.join(__dirname, '../../../../target/idl/hub_token_program.json'),
    path.join(process.cwd(), '../../target/idl/hub_token_program.json'),
  ];

  for (const idlPath of possiblePaths) {
    try {
      if (fs.existsSync(idlPath)) {
        const idlContent = fs.readFileSync(idlPath, 'utf-8');
        console.log(`[IDL] Loaded from: ${idlPath}`);
        return JSON.parse(idlContent);
      }
    } catch {
      // Continue to next path
    }
  }

  console.warn('[IDL] Could not load IDL file');
  return null;
}

@injectable()
export class SolanaProgramAdapter {
  private program: Program | null = null;
  private provider: AnchorProvider;
  private programId: PublicKey;

  constructor(
    @inject(TOKENS.Config) private config: Config,
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter
  ) {
    const connection = solanaConnection.getConnection();
    this.programId = new PublicKey(config.solana.programId);

    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async <T>(tx: T): Promise<T> => tx,
      signAllTransactions: async <T>(txs: T[]): Promise<T[]> => txs,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.provider = new AnchorProvider(connection, dummyWallet as any, {
      commitment: config.solana.commitment,
    });

    try {
      const idl = loadIdl();
      if (idl) {
        this.program = new Program(idl, this.provider);
      }
    } catch (e) {
      console.error('[SolanaProgramAdapter] Failed to initialize program:', e);
    }
  }

  getProgram(): Program | null {
    return this.program;
  }

  isInitialized(): boolean {
    return this.program !== null;
  }

  getProgramId(): PublicKey {
    return this.programId;
  }

  derivePropertyStatePda(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('property'), mint.toBuffer()],
      this.programId
    );
  }

  deriveExtraAccountMetasPda(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('extra-account-metas'), mint.toBuffer()],
      this.programId
    );
  }

  deriveRevenueEpochPda(propertyState: PublicKey, epochNumber: number): [PublicKey, number] {
    const epochBuffer = Buffer.alloc(8);
    epochBuffer.writeBigUInt64LE(BigInt(epochNumber));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('revenue_epoch'), propertyState.toBuffer(), epochBuffer],
      this.programId
    );
  }

  deriveClaimRecordPda(revenueEpoch: PublicKey, investor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('claim_record'), revenueEpoch.toBuffer(), investor.toBuffer()],
      this.programId
    );
  }

  deriveRevenueVaultPda(revenueEpoch: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('revenue_vault'), revenueEpoch.toBuffer()],
      this.programId
    );
  }

  async fetchPropertyState(mint: PublicKey): Promise<unknown | null> {
    if (!this.program) return null;
    const [pda] = this.derivePropertyStatePda(mint);
    try {
      return await (this.program.account as Record<string, { fetch: (pda: PublicKey) => Promise<unknown> }>).propertyState.fetch(pda);
    } catch {
      return null;
    }
  }

  async fetchAllProperties(): Promise<Array<{ account: unknown; publicKey: PublicKey }>> {
    if (!this.program) return [];
    try {
      return await (this.program.account as Record<string, { all: () => Promise<Array<{ account: unknown; publicKey: PublicKey }>> }>).propertyState.all();
    } catch {
      return [];
    }
  }

  async fetchRevenueEpoch(propertyState: PublicKey, epochNumber: number): Promise<unknown | null> {
    if (!this.program) return null;
    const [pda] = this.deriveRevenueEpochPda(propertyState, epochNumber);
    try {
      return await (this.program.account as Record<string, { fetch: (pda: PublicKey) => Promise<unknown> }>).revenueEpoch.fetch(pda);
    } catch {
      return null;
    }
  }

  getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  }
}
