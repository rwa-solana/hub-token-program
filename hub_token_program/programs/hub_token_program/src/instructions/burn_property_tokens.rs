/// Burn property tokens (redemption/exit)
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022, Burn},
    token_interface::{Mint, TokenAccount},
};

use crate::{constants::*, error::RwaError, events::*, state::*};

#[derive(Accounts)]
pub struct BurnPropertyTokens<'info> {
    /// Investor burning their tokens
    #[account(mut)]
    pub investor: Signer<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property token mint (Token-2022)
    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account
    #[account(mut)]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Program<'info, Token2022>,
}

/// Handler for burn_property_tokens instruction
pub fn handler(ctx: Context<BurnPropertyTokens>, amount: u64) -> Result<()> {
    let property_state = &mut ctx.accounts.property_state;

    // Burn tokens
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.investor_token_account.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        },
    );

    token_2022::burn(cpi_context, amount)?;

    // Update circulating supply
    property_state.circulating_supply -= amount;
    property_state.updated_at = Clock::get()?.unix_timestamp;

    // Emit tokens burned event
    emit!(TokensBurned {
        mint: ctx.accounts.mint.key(),
        investor: ctx.accounts.investor.key(),
        amount,
        circulating_supply: property_state.circulating_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Burned {} tokens from investor {} - Circulating: {}/{}",
        amount,
        ctx.accounts.investor.key(),
        property_state.circulating_supply,
        property_state.total_supply
    );

    Ok(())
}
