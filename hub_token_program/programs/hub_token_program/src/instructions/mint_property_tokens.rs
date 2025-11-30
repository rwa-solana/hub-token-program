/// Mint property tokens to investors (requires KYC via Hub Credential)
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, MintTo},
    token_interface::{Mint, TokenAccount},
};

use crate::{constants::*, error::RwaError, events::*, state::*, utils::*};

#[derive(Accounts)]
pub struct MintPropertyTokens<'info> {
    /// Property authority (can mint tokens)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Investor receiving tokens (must have valid Hub Credential)
    /// CHECK: Verified via Hub Credential
    pub investor: UncheckedAccount<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = authority @ RwaError::Unauthorized,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint (Token-2022)
    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account (created externally via createAssociatedTokenAccountIdempotent)
    /// Must be the ATA for the investor and mint using Token-2022
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Hub Credential account for investor KYC
    /// CHECK: Will be verified using Hub Credential program
    /// This account must be owned by HUB_CREDENTIAL_PROGRAM_ID and contain valid KYC credential
    pub investor_credential: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Handler for mint_property_tokens instruction
pub fn handler(ctx: Context<MintPropertyTokens>, amount: u64) -> Result<()> {
    let property_state = &mut ctx.accounts.property_state;

    // 1. Verify property is active
    require!(property_state.is_active, RwaError::PropertyNotActive);

    // 2. Verify minting won't exceed total supply
    require!(
        property_state.circulating_supply + amount <= property_state.total_supply,
        RwaError::ExceedsMaxSupply
    );

    // 3. Verify Hub Credential for KYC compliance
    verify_hub_credential(
        &ctx.accounts.investor_credential.to_account_info(),
        &ctx.accounts.investor.key(),
        &ctx.accounts.mint.key(),
    )?;

    msg!(
        "Hub Credential verification passed for investor: {}",
        ctx.accounts.investor.key()
    );

    // 4. Mint tokens to investor
    let mint_key = property_state.mint;
    let seeds = &[
        PROPERTY_STATE_SEED,
        mint_key.as_ref(),
        &[property_state.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            authority: property_state.to_account_info(),
        },
        signer_seeds,
    );

    token_2022::mint_to(cpi_context, amount)?;

    // 5. Update circulating supply
    property_state.circulating_supply += amount;
    property_state.updated_at = Clock::get()?.unix_timestamp;

    // 6. Emit tokens minted event
    emit!(TokensMinted {
        mint: ctx.accounts.mint.key(),
        investor: ctx.accounts.investor.key(),
        amount,
        circulating_supply: property_state.circulating_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Minted {} tokens to investor {} - Circulating: {}/{}",
        amount,
        ctx.accounts.investor.key(),
        property_state.circulating_supply,
        property_state.total_supply
    );

    Ok(())
}
