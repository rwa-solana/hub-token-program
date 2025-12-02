import { injectable, inject } from 'tsyringe';
import { PublicKey } from '@solana/web3.js';
import { TOKENS } from '../../shared/container/tokens';
import { SolanaProgramAdapter } from '../solana/SolanaProgramAdapter';
import { SolanaConnectionAdapter } from '../solana/SolanaConnectionAdapter';
import { IRevenueRepository } from '../../application/ports/IRevenueRepository';
import { RevenueEpochEntity, ClaimRecordEntity } from '../../domain/entities';

@injectable()
export class RevenueRepositoryImpl implements IRevenueRepository {
  constructor(
    @inject(TOKENS.SolanaProgram) private programAdapter: SolanaProgramAdapter,
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter
  ) {}

  async findEpochByProperty(propertyMint: string, epochNumber: number): Promise<RevenueEpochEntity | null> {
    try {
      const mint = new PublicKey(propertyMint);
      const [propertyStatePda] = this.programAdapter.derivePropertyStatePda(mint);
      const data = await this.programAdapter.fetchRevenueEpoch(propertyStatePda, epochNumber);

      if (!data) return null;

      const [epochPda] = this.programAdapter.deriveRevenueEpochPda(propertyStatePda, epochNumber);

      return RevenueEpochEntity.fromOnChain(data, epochPda.toString(), propertyMint);
    } catch {
      return null;
    }
  }

  async findCurrentEpoch(propertyMint: string): Promise<RevenueEpochEntity | null> {
    const mint = new PublicKey(propertyMint);
    const propertyState = await this.programAdapter.fetchPropertyState(mint);

    if (!propertyState) return null;

    const currentEpoch = (propertyState as any).currentEpoch || 0;
    return this.findEpochByProperty(propertyMint, currentEpoch);
  }

  async findAllEpochsByProperty(propertyMint: string): Promise<RevenueEpochEntity[]> {
    const epochs: RevenueEpochEntity[] = [];

    // Try to find epochs starting from 1, up to a reasonable max
    // Epochs are sequential starting from 1
    const MAX_EPOCHS_TO_CHECK = 100;

    for (let i = 1; i <= MAX_EPOCHS_TO_CHECK; i++) {
      const epoch = await this.findEpochByProperty(propertyMint, i);
      if (epoch) {
        epochs.push(epoch);
      } else {
        // Stop when we find a gap (no more epochs)
        break;
      }
    }

    return epochs;
  }

  async findClaimRecord(epochAccount: string, investorWallet: string): Promise<ClaimRecordEntity | null> {
    try {
      const epoch = new PublicKey(epochAccount);
      const investor = new PublicKey(investorWallet);
      const [claimPda] = this.programAdapter.deriveClaimRecordPda(epoch, investor);

      const connection = this.solanaConnection.getConnection();
      const accountInfo = await connection.getAccountInfo(claimPda);

      if (!accountInfo) return null;

      // Parse claim record data
      // Structure: discriminator (8) + epoch (32) + investor (32) + claimed (1) + amount (8) + timestamp (8)
      const data = accountInfo.data;
      if (data.length < 89) return null;

      const claimed = data[72] === 1;
      const amountClaimed = data.readBigUInt64LE(73);
      const claimedAt = data.readBigInt64LE(81);

      return new ClaimRecordEntity({
        account: claimPda.toString(),
        epochAccount,
        investorWallet,
        amountClaimed,
        claimed,
        claimedAt: claimedAt > 0n ? new Date(Number(claimedAt) * 1000) : null,
      });
    } catch {
      return null;
    }
  }

  async getClaimableAmount(epochAccount: string, investorWallet: string): Promise<bigint> {
    try {
      const claimRecord = await this.findClaimRecord(epochAccount, investorWallet);

      if (claimRecord?.claimed) {
        return 0n;
      }

      // Fetch epoch data to get total revenue and eligible supply
      const epochPubkey = new PublicKey(epochAccount);
      const connection = this.solanaConnection.getConnection();
      const epochInfo = await connection.getAccountInfo(epochPubkey);

      if (!epochInfo) return 0n;

      const data = epochInfo.data;
      // Parse epoch data: discriminator(8) + propertyState(32) + epochNumber(8) + totalRevenue(8) + eligibleSupply(8) + ...
      if (data.length < 64) return 0n;

      const totalRevenue = data.readBigUInt64LE(48); // offset 8+32+8 = 48
      const eligibleSupply = data.readBigUInt64LE(56); // offset 48+8 = 56

      if (eligibleSupply === 0n) return 0n;

      // Get investor's token balance
      const investor = new PublicKey(investorWallet);

      // Read propertyState pubkey from epoch data
      const propertyStatePubkey = new PublicKey(data.slice(8, 40));

      // Fetch property state to get mint
      const propertyStateInfo = await connection.getAccountInfo(propertyStatePubkey);
      if (!propertyStateInfo) return 0n;

      // Parse property state: discriminator(8) + authority(32) + mint(32)
      // So mint is at offset 40-72
      const mint = new PublicKey(propertyStateInfo.data.slice(40, 72));

      // Get investor's ATA
      const { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } = await import('@solana/spl-token');
      const investorAta = getAssociatedTokenAddressSync(mint, investor, false, TOKEN_2022_PROGRAM_ID);

      // Get balance
      const tokenAccount = await connection.getAccountInfo(investorAta);
      if (!tokenAccount) return 0n;

      // Parse token account balance (offset 64 for Token-2022)
      const investorBalance = tokenAccount.data.readBigUInt64LE(64);

      // Calculate proportional share: (investorBalance / eligibleSupply) * totalRevenue
      const claimableAmount = (investorBalance * totalRevenue) / eligibleSupply;

      return claimableAmount;
    } catch {
      return 0n;
    }
  }

  async getTotalDistributed(propertyMint: string): Promise<bigint> {
    const epochs = await this.findAllEpochsByProperty(propertyMint);
    return epochs.reduce((total, epoch) => total + epoch.totalClaimed, 0n);
  }

  async getUnclaimedAmount(propertyMint: string): Promise<bigint> {
    const epochs = await this.findAllEpochsByProperty(propertyMint);
    return epochs.reduce((total, epoch) => {
      const unclaimed = epoch.totalAmount - epoch.totalClaimed;
      return total + unclaimed;
    }, 0n);
  }
}
