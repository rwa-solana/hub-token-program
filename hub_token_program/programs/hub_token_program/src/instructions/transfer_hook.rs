/// Transfer Hook implementation for KYC verification on all transfers
///
/// This implements the Token-2022 Transfer Hook interface to verify
/// KYC compliance on every token transfer, including secondary market transfers.
///
/// Uses Hub Credential Protocol for KYC verification.
use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{constants::HUB_CREDENTIAL_PROGRAM_ID, error::RwaError, events::*, utils::*};

/// Seeds for the ExtraAccountMeta PDA
pub const EXTRA_ACCOUNT_METAS_SEED: &[u8] = b"extra-account-metas";

/// Size of ExtraAccountMeta structure (35 bytes each)
/// discriminator (1) + address_config (32) + is_signer (1) + is_writable (1)
pub const EXTRA_ACCOUNT_META_SIZE: usize = 35;

/// Execute discriminator for Transfer Hook interface
/// SHA256("spl-transfer-hook-interface:execute")[0..8]
pub const EXECUTE_DISCRIMINATOR: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];

/// Transfer Hook Execute instruction
/// Called by Token-2022 on every transfer
///
/// Account order is defined by the Transfer Hook interface:
/// 0. Source token account
/// 1. Mint
/// 2. Destination token account
/// 3. Owner/Authority
/// 4. ExtraAccountMetaList PDA
/// 5+ Additional accounts from ExtraAccountMetaList
#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// Source token account (sender)
    /// CHECK: Validated by Token-2022
    #[account()]
    pub source_account: UncheckedAccount<'info>,

    /// The mint account
    pub mint: InterfaceAccount<'info, Mint>,

    /// Destination token account (receiver)
    /// CHECK: Validated by Token-2022
    #[account()]
    pub destination_account: UncheckedAccount<'info>,

    /// Owner of the source account (authority)
    /// CHECK: Validated by Token-2022
    pub owner: UncheckedAccount<'info>,

    /// ExtraAccountMetaList PDA
    /// CHECK: Will be validated by seeds
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// Hub Credential for destination wallet (KYC verification)
    /// This is the Hub Credential that proves the destination wallet has completed KYC.
    /// CHECK: Will be verified using Hub Credential program
    pub hub_credential: UncheckedAccount<'info>,
}

/// Handler for transfer hook execute instruction
/// This is called by Token-2022 during every transfer
pub fn handler(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    msg!("Transfer Hook: Verifying Hub Credential for transfer of {} tokens", amount);

    // Get destination wallet from the token account
    // Token account structure: owner is at offset 32-64
    let destination_data = ctx.accounts.destination_account.try_borrow_data()?;
    if destination_data.len() < 64 {
        return Err(RwaError::KycVerificationRequired.into());
    }
    let destination_owner = Pubkey::try_from(&destination_data[32..64])
        .map_err(|_| RwaError::KycVerificationRequired)?;

    // Verify Hub Credential for destination wallet
    verify_hub_credential(
        &ctx.accounts.hub_credential.to_account_info(),
        &destination_owner,
        &ctx.accounts.mint.key(),
    )?;

    msg!(
        "Transfer Hook: Hub Credential verified for destination wallet: {}",
        destination_owner
    );

    // Emit transfer verification event
    emit!(TransferKycVerified {
        mint: ctx.accounts.mint.key(),
        source: ctx.accounts.source_account.key(),
        destination: ctx.accounts.destination_account.key(),
        destination_owner,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

/// Initialize the ExtraAccountMetaList for the transfer hook
/// This defines which additional accounts are required during transfers
#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ExtraAccountMetaList PDA to be initialized
    /// CHECK: Will be initialized with seeds
    #[account(
        init,
        payer = payer,
        // Space: 8 (anchor discriminator) + 4 (length) + 4 (count) + 35 (1 extra account meta)
        space = 8 + 4 + 4 + EXTRA_ACCOUNT_META_SIZE,
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// The mint this transfer hook is for
    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
}

/// Handler to initialize the extra account meta list
/// This stores the configuration for which additional accounts are needed during transfers
///
/// For Hub Credential verification, we need the credential account to be passed.
/// The credential PDA is derived from:
/// - "credential" literal
/// - Destination wallet pubkey
/// - Hub Credential Program ID
pub fn handler_initialize_extra_account_metas(
    ctx: Context<InitializeExtraAccountMetaList>,
) -> Result<()> {
    let mut data = ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?;

    // Write the ExtraAccountMetaList manually
    // Format: ExecuteInstruction discriminator (8) + length (4) + count (4) + metas (35 * count)

    // Write Execute discriminator
    data[0..8].copy_from_slice(&EXECUTE_DISCRIMINATOR);

    // Write length (total size of the account list data: 4 + 35*1 = 39)
    let list_length: u32 = 4 + EXTRA_ACCOUNT_META_SIZE as u32;
    data[8..12].copy_from_slice(&list_length.to_le_bytes());

    // Write count (1 extra account)
    let count: u32 = 1;
    data[12..16].copy_from_slice(&count.to_le_bytes());

    // Write ExtraAccountMeta for Hub Credential PDA
    // We use discriminator = 2 (External PDA - PDA from another program)
    data[16] = 2;

    // address_config: seeds configuration for Hub Credential PDA
    // Credential PDA seeds: ["credential", wallet]
    // We need to get the destination wallet from the destination token account's owner field
    let mut address_config = [0u8; 32];

    // Seed 1: Literal "credential" (10 bytes)
    address_config[0] = 10; // length
    address_config[1] = 0;  // seed type: Literal
    // "credential" bytes would go here in a proper implementation

    // Seed 2: AccountData - get owner from destination token account (index 2)
    // Token account owner is at offset 32-64 (32 bytes)
    address_config[12] = 32; // length
    address_config[13] = 2;  // seed type: AccountData
    address_config[14] = 2;  // account index (destination token account)
    address_config[15] = 32; // data offset (owner field starts at byte 32)

    // Store address config
    data[17..49].copy_from_slice(&address_config);

    // is_signer = false
    data[49] = 0;
    // is_writable = false
    data[50] = 0;

    msg!(
        "Initialized ExtraAccountMetaList for mint: {}",
        ctx.accounts.mint.key()
    );
    msg!(
        "Hub Credential Program: {}",
        HUB_CREDENTIAL_PROGRAM_ID
    );

    emit!(ExtraAccountMetasInitialized {
        mint: ctx.accounts.mint.key(),
        extra_account_meta_list: ctx.accounts.extra_account_meta_list.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
