import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import idl from '../../../target/idl/hub_token_program.json';

const PROGRAM_ID = new PublicKey('FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om');

export function useClaimRevenue() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyMint,
      epochNumber,
    }: {
      propertyMint: string;
      epochNumber: number;
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      const propertyMintPubkey = new PublicKey(propertyMint);

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );

      // Create program
      const program = new Program(idl as any, PROGRAM_ID, provider);

      // Derive PDAs
      const [propertyState] = PublicKey.findProgramAddressSync(
        [Buffer.from('property'), propertyMintPubkey.toBuffer()],
        PROGRAM_ID
      );

      const [revenueEpoch] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('revenue_epoch'),
          propertyState.toBuffer(),
          new BN(epochNumber).toArrayLike(Buffer, 'le', 8),
        ],
        PROGRAM_ID
      );

      const [claimRecord] = PublicKey.findProgramAddressSync(
        [Buffer.from('claim_record'), revenueEpoch.toBuffer(), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [revenueVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('revenue_vault'), revenueEpoch.toBuffer()],
        PROGRAM_ID
      );

      const investorTokenAccount = getAssociatedTokenAddressSync(
        propertyMintPubkey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log('Claiming revenue...');
      console.log('Property Mint:', propertyMint);
      console.log('Epoch Number:', epochNumber);
      console.log('Investor:', wallet.publicKey.toString());
      console.log('Revenue Epoch:', revenueEpoch.toString());
      console.log('Claim Record:', claimRecord.toString());
      console.log('Revenue Vault:', revenueVault.toString());

      // Call claim_revenue instruction
      const tx = await program.methods
        .claimRevenue()
        .accounts({
          investor: wallet.publicKey,
          propertyState,
          mint: propertyMintPubkey,
          investorTokenAccount,
          revenueEpoch,
          claimRecord,
          revenueVault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Claim successful! Transaction:', tx);

      return { signature: tx };
    },
    onSuccess: (data) => {
      toast.success('Revenue claimed successfully!', {
        description: `Transaction: ${data.signature.slice(0, 8)}...`,
      });

      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['claimable-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error: any) => {
      console.error('Claim failed:', error);
      toast.error('Failed to claim revenue', {
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
}
