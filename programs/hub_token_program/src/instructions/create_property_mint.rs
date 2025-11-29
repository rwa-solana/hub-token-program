/// Create a new property mint with TransferHook extension
///
/// This instruction creates a Token-2022 mint with the TransferHook extension
/// enabled, ensuring ALL transfers (including P2P) verify KYC compliance.
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_2022::spl_token_2022::{
    extension::ExtensionType,
    instruction::initialize_mint2,
    state::Mint as MintState,
};
use anchor_spl::token_2022::Token2022;

use crate::{constants::*, error::RwaError, events::*, state::*, instructions::transfer_hook::*};

/// Accounts for creating a property mint with TransferHook
#[derive(Accounts)]
#[instruction(property_name: String, property_symbol: String)]
pub struct CreatePropertyMint<'info> {
    /// Authority who will own the property
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The mint account to be created
    /// CHECK: Will be initialized as Token-2022 mint with TransferHook extension
    #[account(
        mut,
        signer,
    )]
    pub mint: AccountInfo<'info>,

    /// PropertyState PDA
    #[account(
        init,
        payer = authority,
        space = 8 + PropertyState::INIT_SPACE,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// ExtraAccountMetaList PDA for Transfer Hook
    /// CHECK: Will be initialized with proper seeds
    #[account(
        init,
        payer = authority,
        space = 8 + 4 + 4 + EXTRA_ACCOUNT_META_SIZE,
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

/// Handler for create_property_mint instruction
pub fn handler(
    ctx: Context<CreatePropertyMint>,
    property_name: String,
    property_symbol: String,
    decimals: u8,
    total_supply: u64,
    property_details: PropertyDetails,
) -> Result<()> {
    // Validate inputs
    require!(
        property_name.len() <= MAX_PROPERTY_NAME_LEN,
        RwaError::PropertyNameTooLong
    );
    require!(
        property_symbol.len() <= MAX_PROPERTY_SYMBOL_LEN,
        RwaError::PropertySymbolTooLong
    );
    require!(total_supply > 0, RwaError::InvalidTotalSupply);
    property_details.validate()?;

    let program_id = crate::ID;
    let mint = &ctx.accounts.mint;
    let authority = &ctx.accounts.authority;
    let property_state = &ctx.accounts.property_state;

    // Calculate space for mint with TransferHook extension
    let extension_types = [ExtensionType::TransferHook];
    let mint_size = ExtensionType::try_calculate_account_len::<MintState>(&extension_types)
        .map_err(|_| RwaError::MathOverflow)?;

    // Create mint account
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(mint_size);

    system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: authority.to_account_info(),
                to: mint.to_account_info(),
            },
        ),
        lamports,
        mint_size as u64,
        &anchor_spl::token_2022::ID,
    )?;

    // Initialize TransferHook extension
    // Must be done BEFORE initializing the mint
    let init_hook_ix = anchor_spl::token_2022::spl_token_2022::extension::transfer_hook::instruction::initialize(
        &anchor_spl::token_2022::ID,
        &mint.key(),
        Some(authority.key()),
        Some(program_id),
    )?;

    anchor_lang::solana_program::program::invoke(
        &init_hook_ix,
        &[
            mint.to_account_info(),
        ],
    )?;

    // Initialize mint
    let init_mint_ix = initialize_mint2(
        &anchor_spl::token_2022::ID,
        &mint.key(),
        &property_state.key(), // Mint authority = PropertyState PDA
        None,                   // No freeze authority
        decimals,
    )?;

    anchor_lang::solana_program::program::invoke(
        &init_mint_ix,
        &[
            mint.to_account_info(),
        ],
    )?;

    // Initialize PropertyState
    let property_state = &mut ctx.accounts.property_state;
    property_state.authority = authority.key();
    property_state.mint = mint.key();
    property_state.property_name = property_name.clone();
    property_state.property_symbol = property_symbol.clone();
    property_state.total_supply = total_supply;
    property_state.circulating_supply = 0;
    property_state.details = property_details.clone();
    property_state.is_active = true;
    property_state.created_at = Clock::get()?.unix_timestamp;
    property_state.updated_at = Clock::get()?.unix_timestamp;
    property_state.bump = ctx.bumps.property_state;

    // Initialize ExtraAccountMetaList for Transfer Hook
    initialize_extra_account_meta_list(&ctx.accounts.extra_account_meta_list, &mint.key())?;

    // Emit events
    emit!(PropertyInitialized {
        mint: mint.key(),
        authority: authority.key(),
        property_name,
        property_symbol,
        total_supply,
        property_address: property_details.property_address,
        timestamp: Clock::get()?.unix_timestamp,
    });

    emit!(ExtraAccountMetasInitialized {
        mint: mint.key(),
        extra_account_meta_list: ctx.accounts.extra_account_meta_list.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Property mint created with TransferHook extension");
    msg!("Mint: {}", mint.key());
    msg!("Transfer Hook Program: {}", program_id);
    msg!("All transfers will now verify KYC!");

    Ok(())
}

/// Helper function to initialize ExtraAccountMetaList
fn initialize_extra_account_meta_list(
    extra_account_meta_list: &AccountInfo,
    mint: &Pubkey,
) -> Result<()> {
    let mut data = extra_account_meta_list.try_borrow_mut_data()?;

    // Write Execute discriminator
    data[0..8].copy_from_slice(&EXECUTE_DISCRIMINATOR);

    // Write length (total size of the account list data: 4 + 35*1 = 39)
    let list_length: u32 = 4 + EXTRA_ACCOUNT_META_SIZE as u32;
    data[8..12].copy_from_slice(&list_length.to_le_bytes());

    // Write count (1 extra account)
    let count: u32 = 1;
    data[12..16].copy_from_slice(&count.to_le_bytes());

    // Write ExtraAccountMeta for destination attestation
    // discriminator = 1 (PDA from external program - SAS)
    data[16] = 1;

    // address_config: seeds configuration for SAS attestation lookup
    let mut address_config = [0u8; 32];
    // Seed 1: Literal "attestation"
    address_config[0] = 11; // length
    address_config[1] = 0;  // seed type: Literal
    address_config[2..13].copy_from_slice(b"attestation");
    // Seed 2: AccountKey index 2 (destination token account)
    address_config[13] = 1; // length
    address_config[14] = 1; // seed type: AccountKey
    address_config[15] = 2; // index

    data[17..49].copy_from_slice(&address_config);

    // is_signer = false
    data[49] = 0;
    // is_writable = false
    data[50] = 0;

    msg!("ExtraAccountMetaList initialized for mint: {}", mint);

    Ok(())
}
