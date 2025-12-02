import { injectable, inject } from 'tsyringe';
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../config/Config';
import { SolanaConnectionAdapter } from './SolanaConnectionAdapter';
import { SolanaProgramAdapter } from './SolanaProgramAdapter';

// Hub Credential Program ID (devnet)
const HUB_CREDENTIAL_PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');

export interface CreatePropertyInput {
  name: string;
  symbol: string;
  totalSupply: number;
  details: {
    propertyType: string;
    propertyAddress: string;
    totalValueUsd: number;
    annualYieldPercent: number;
    metadataUri: string;
  };
}

export interface MintTokensInput {
  propertyMint: string;
  investorWallet: string;
  amount: number;
}

export interface DepositRevenueInput {
  propertyMint: string;
  epochNumber: number;
  amountSol: number;
}

@injectable()
export class AdminService {
  private adminKeypair: Keypair | null = null;

  constructor(
    @inject(TOKENS.Config) private config: Config,
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter,
    @inject(TOKENS.SolanaProgram) private programAdapter: SolanaProgramAdapter
  ) {
    this.loadAdminKeypair();
  }

  private loadAdminKeypair(): void {
    const keypairPaths = [
      process.env.ADMIN_KEYPAIR_PATH,
      path.join(process.env.HOME || '', '.config/solana/id.json'),
      path.join(process.cwd(), 'admin-keypair.json'),
    ].filter(Boolean);

    for (const keypairPath of keypairPaths) {
      try {
        if (keypairPath && fs.existsSync(keypairPath)) {
          const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
          this.adminKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
          console.log(`[AdminService] Loaded keypair from: ${keypairPath}`);
          console.log(`[AdminService] Admin wallet: ${this.adminKeypair.publicKey.toString()}`);
          return;
        }
      } catch (error) {
        console.warn(`[AdminService] Failed to load keypair from ${keypairPath}:`, error);
      }
    }

    console.warn('[AdminService] No admin keypair found. Admin operations will fail.');
  }

  isInitialized(): boolean {
    return this.adminKeypair !== null && this.programAdapter.isInitialized();
  }

  getAdminPublicKey(): PublicKey | null {
    return this.adminKeypair?.publicKey || null;
  }

  verifyAdminWallet(walletAddress: string): boolean {
    if (!this.adminKeypair) return false;
    return this.adminKeypair.publicKey.toString() === walletAddress;
  }

  async createProperty(input: CreatePropertyInput): Promise<{ mint: string; signature: string }> {
    if (!this.adminKeypair) {
      throw new Error('Admin keypair not loaded');
    }

    const program = this.programAdapter.getProgram();
    if (!program) {
      throw new Error('Program not initialized');
    }

    const connection = this.solanaConnection.getConnection();

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // Derive PDAs
    const [propertyState] = this.programAdapter.derivePropertyStatePda(mint);
    const [extraAccountMetas] = this.programAdapter.deriveExtraAccountMetasPda(mint);

    // Convert values to on-chain format
    const decimals = 6;
    const totalSupplyWithDecimals = BigInt(input.totalSupply) * BigInt(Math.pow(10, decimals));
    const totalValueUsdCents = Math.floor(input.details.totalValueUsd * 100);
    const rentalYieldBps = Math.floor(input.details.annualYieldPercent * 100);

    // Build instructions
    const instructions: TransactionInstruction[] = [];

    // 1. Add compute budget (the program creates everything internally)
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );

    // 2. Call create_property_mint instruction
    // The program handles: mint creation, TransferHook init, mint init, PDAs
    const createPropertyIx = await program.methods
      .createPropertyMint(
        input.name,
        input.symbol,
        decimals,
        new BN(totalSupplyWithDecimals.toString()),
        {
          propertyAddress: input.details.propertyAddress,
          propertyType: input.details.propertyType,
          totalValueUsd: new BN(totalValueUsdCents),
          rentalYieldBps: rentalYieldBps,
          metadataUri: input.details.metadataUri || '',
        }
      )
      .accounts({
        authority: this.adminKeypair.publicKey,
        mint: mint,
        propertyState: propertyState,
        extraAccountMetaList: extraAccountMetas,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    instructions.push(createPropertyIx);

    // Create and send transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = this.adminKeypair.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [this.adminKeypair, mintKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`[AdminService] Property created: ${mint.toString()}`);
    console.log(`[AdminService] Transaction: ${signature}`);

    return {
      mint: mint.toString(),
      signature,
    };
  }

  /**
   * Derive the Hub Credential PDA for a wallet
   * Seeds: ["credential", wallet]
   */
  private deriveInvestorCredentialPda(investor: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), investor.toBuffer()],
      HUB_CREDENTIAL_PROGRAM_ID
    );
    return pda;
  }

  /**
   * Verify investor KYC via Hub Credential API
   * Returns true if investor has valid KYC, throws error otherwise
   */
  async verifyInvestorKyc(investorWallet: string): Promise<{ isValid: boolean; credential: any }> {
    try {
      const response = await axios.post(
        `${this.config.hubCredential.apiUrl}/api/credentials/verify`,
        { userWallet: investorWallet }
      );

      if (!response.data.success) {
        throw new Error(response.data.reason || 'KYC verification failed');
      }

      if (!response.data.isValid) {
        throw new Error(response.data.reason || 'Investor does not have valid KYC');
      }

      console.log(`[AdminService] KYC verified for investor: ${investorWallet}`);
      console.log(`[AdminService] Credential type: ${response.data.credential?.credentialType}`);
      console.log(`[AdminService] Expires at: ${new Date(response.data.credential?.expiresAt * 1000).toISOString()}`);

      return {
        isValid: true,
        credential: response.data.credential,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Investor does not have a KYC credential. Please complete identity verification first.');
      }
      throw new Error(`KYC verification failed: ${error.message}`);
    }
  }

  async mintTokens(input: MintTokensInput): Promise<{ tokenAccount: string; signature: string; kycVerified: boolean }> {
    if (!this.adminKeypair) {
      throw new Error('Admin keypair not loaded');
    }

    const program = this.programAdapter.getProgram();
    if (!program) {
      throw new Error('Program not initialized');
    }

    const connection = this.solanaConnection.getConnection();
    const mint = new PublicKey(input.propertyMint);
    const investor = new PublicKey(input.investorWallet);

    // Step 1: Verify KYC via Hub Credential API
    console.log(`[AdminService] Step 1: Verifying KYC for investor ${input.investorWallet}...`);
    const kycResult = await this.verifyInvestorKyc(input.investorWallet);

    // Step 2: Derive PDAs
    console.log(`[AdminService] Step 2: Deriving PDAs...`);
    const [propertyState] = this.programAdapter.derivePropertyStatePda(mint);
    const investorCredential = this.deriveInvestorCredentialPda(investor);

    console.log(`[AdminService] PropertyState PDA: ${propertyState.toString()}`);
    console.log(`[AdminService] Investor Credential PDA: ${investorCredential.toString()}`);

    // Get investor's token account
    const investorTokenAccount = getAssociatedTokenAddressSync(
      mint,
      investor,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Build instructions
    const instructions: TransactionInstruction[] = [];

    // Add compute budget
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );

    // Create ATA if needed (idempotent) - IMPORTANT: Must use Token-2022 program
    // The Anchor `init` constraint tries to use standard Token program which fails for Token-2022 mints
    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.adminKeypair.publicKey,
        investorTokenAccount,
        investor,
        mint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    // Step 3: Mint tokens instruction (includes on-chain KYC verification)
    // Convert token amount to base units (with 6 decimals)
    const decimals = 6;
    const amountWithDecimals = BigInt(input.amount) * BigInt(Math.pow(10, decimals));
    console.log(`[AdminService] Step 3: Minting ${input.amount} tokens (${amountWithDecimals} base units) to investor...`);
    const mintIx = await program.methods
      .mintPropertyTokens(new BN(amountWithDecimals.toString()))
      .accounts({
        authority: this.adminKeypair.publicKey,
        investor: investor,
        propertyState: propertyState,
        mint: mint,
        investorTokenAccount: investorTokenAccount,
        investorCredential: investorCredential,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    instructions.push(mintIx);

    // Create and send transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = this.adminKeypair.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [this.adminKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`[AdminService] ✅ Tokens minted successfully!`);
    console.log(`[AdminService] Token Account: ${investorTokenAccount.toString()}`);
    console.log(`[AdminService] Transaction: ${signature}`);

    return {
      tokenAccount: investorTokenAccount.toString(),
      signature,
      kycVerified: true,
    };
  }

  async depositRevenue(input: DepositRevenueInput): Promise<{ revenueVault: string; signature: string }> {
    if (!this.adminKeypair) {
      throw new Error('Admin keypair not loaded');
    }

    const program = this.programAdapter.getProgram();
    if (!program) {
      throw new Error('Program not initialized');
    }

    const connection = this.solanaConnection.getConnection();
    const mint = new PublicKey(input.propertyMint);

    // Derive PDAs
    const [propertyState] = this.programAdapter.derivePropertyStatePda(mint);
    const [revenueEpoch] = this.programAdapter.deriveRevenueEpochPda(propertyState, input.epochNumber);
    const [revenueVault] = this.programAdapter.deriveRevenueVaultPda(revenueEpoch);

    // Convert SOL to lamports
    const amountLamports = Math.floor(input.amountSol * LAMPORTS_PER_SOL);

    // Build instructions
    const instructions: TransactionInstruction[] = [];

    // Add compute budget
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );

    // Deposit revenue instruction
    const depositIx = await program.methods
      .depositRevenue(new BN(input.epochNumber), new BN(amountLamports))
      .accounts({
        authority: this.adminKeypair.publicKey,
        mint: mint,
        propertyState: propertyState,
        revenueEpoch: revenueEpoch,
        revenueVault: revenueVault,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    instructions.push(depositIx);

    // Create and send transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = this.adminKeypair.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [this.adminKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`[AdminService] Revenue deposited to: ${revenueVault.toString()}`);
    console.log(`[AdminService] Transaction: ${signature}`);

    return {
      revenueVault: revenueVault.toString(),
      signature,
    };
  }

  async togglePropertyStatus(propertyMint: string): Promise<{ signature: string }> {
    if (!this.adminKeypair) {
      throw new Error('Admin keypair not loaded');
    }

    const program = this.programAdapter.getProgram();
    if (!program) {
      throw new Error('Program not initialized');
    }

    const connection = this.solanaConnection.getConnection();
    const mint = new PublicKey(propertyMint);

    // Derive PDA
    const [propertyState] = this.programAdapter.derivePropertyStatePda(mint);

    // Toggle status instruction
    const toggleIx = await program.methods
      .togglePropertyStatus()
      .accounts({
        authority: this.adminKeypair.publicKey,
        mint: mint,
        propertyState: propertyState,
      })
      .instruction();

    const transaction = new Transaction().add(toggleIx);
    transaction.feePayer = this.adminKeypair.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [this.adminKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`[AdminService] Property status toggled: ${propertyMint}`);
    console.log(`[AdminService] Transaction: ${signature}`);

    return { signature };
  }

  /**
   * Claim revenue for an investor
   */
  async claimRevenue(input: {
    propertyMint: string;
    investorWallet: string;
    epochNumber: number;
  }): Promise<{ signature: string; amountClaimed: number }> {
    const program = this.programAdapter.getProgram();
    const connection = this.connectionAdapter.getConnection();

    const propertyMintPubkey = new PublicKey(input.propertyMint);
    const investorPubkey = new PublicKey(input.investorWallet);

    console.log(`[AdminService] Claiming revenue for investor: ${input.investorWallet}`);
    console.log(`[AdminService] Property: ${input.propertyMint}, Epoch: ${input.epochNumber}`);

    // Derive PDAs
    const [propertyState] = this.programAdapter.derivePropertyStatePda(propertyMintPubkey);
    const [revenueEpoch] = this.programAdapter.deriveRevenueEpochPda(
      propertyState,
      input.epochNumber
    );
    const [claimRecord] = this.programAdapter.deriveClaimRecordPda(
      revenueEpoch,
      investorPubkey
    );
    const [revenueVault] = this.programAdapter.deriveRevenueVaultPda(revenueEpoch);

    // Get investor's token account
    const investorTokenAccount = getAssociatedTokenAddressSync(
      propertyMintPubkey,
      investorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(`[AdminService] Revenue Epoch PDA: ${revenueEpoch.toString()}`);
    console.log(`[AdminService] Claim Record PDA: ${claimRecord.toString()}`);
    console.log(`[AdminService] Revenue Vault: ${revenueVault.toString()}`);

    // Since we're using the admin wallet, we need to create a transaction
    // that the investor will sign via the frontend
    // For now, this is a placeholder - the actual claim should be done client-side
    throw new Error('Claim revenue must be done client-side by the investor with their wallet');
  }
}
