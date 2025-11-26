/// Initialize a new tokenized real estate property
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{Token2022, SetAuthority},
    token_interface::{Mint, set_authority, spl_token_2022::instruction::AuthorityType},
};

use crate::{constants::*, error::RwaError, events::*, state::*};

#[derive(Accounts)]
#[instruction(_decimals: u8, property_name: String, property_symbol: String)]
pub struct InitializeProperty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The Token-2022 mint for this property (must be pre-created with authority as mint authority)
    #[account(
        mut,
        constraint = mint.mint_authority.unwrap() == authority.key() @ RwaError::Unauthorized,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// PropertyState PDA
    #[account(
        init,
        payer = authority,
        space = 8 + PropertyState::INIT_SPACE,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

/// Handler for initialize_property instruction
pub fn handler(
    ctx: Context<InitializeProperty>,
    _decimals: u8,
    property_name: String,
    property_symbol: String,
    total_supply: u64,
    property_details: PropertyDetails,
) -> Result<()> {
    // Validate property name length
    require!(
        property_name.len() <= MAX_PROPERTY_NAME_LEN,
        RwaError::PropertyNameTooLong
    );

    // Validate property symbol length
    require!(
        property_symbol.len() <= MAX_PROPERTY_SYMBOL_LEN,
        RwaError::PropertySymbolTooLong
    );

    // Validate total supply
    require!(total_supply > 0, RwaError::InvalidTotalSupply);

    // Validate property details
    property_details.validate()?;

    // Initialize property state
    let property_state = &mut ctx.accounts.property_state;
    property_state.authority = ctx.accounts.authority.key();
    property_state.mint = ctx.accounts.mint.key();
    property_state.property_name = property_name.clone();
    property_state.property_symbol = property_symbol.clone();
    property_state.total_supply = total_supply;
    property_state.circulating_supply = 0;
    property_state.details = property_details.clone();
    property_state.is_active = true;
    property_state.created_at = Clock::get()?.unix_timestamp;
    property_state.updated_at = Clock::get()?.unix_timestamp;
    property_state.bump = ctx.bumps.property_state;

    // Transfer mint authority from authority to PropertyState PDA
    let cpi_accounts = SetAuthority {
        current_authority: ctx.accounts.authority.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    set_authority(
        cpi_ctx,
        AuthorityType::MintTokens,
        Some(property_state.key()),
    )?;

    // Emit initialization event
    emit!(PropertyInitialized {
        mint: ctx.accounts.mint.key(),
        authority: ctx.accounts.authority.key(),
        property_name,
        property_symbol,
        total_supply,
        property_address: property_details.property_address,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Property initialized: {} ({}) - {} tokens",
        property_state.property_name,
        property_state.property_symbol,
        total_supply
    );
    msg!("Mint authority transferred to PropertyState PDA");

    Ok(())
}
