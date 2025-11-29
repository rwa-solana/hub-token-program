/// Toggle property active status (enable/disable minting)
use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{constants::*, error::RwaError, events::*, state::*};

#[derive(Accounts)]
pub struct TogglePropertyStatus<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

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
    pub mint: Box<InterfaceAccount<'info, Mint>>,
}

/// Handler for toggle_property_status instruction
pub fn handler(ctx: Context<TogglePropertyStatus>) -> Result<()> {
    let property_state = &mut ctx.accounts.property_state;

    // Toggle active status
    property_state.is_active = !property_state.is_active;
    property_state.updated_at = Clock::get()?.unix_timestamp;

    // Emit status changed event
    emit!(PropertyStatusChanged {
        mint: ctx.accounts.mint.key(),
        is_active: property_state.is_active,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Property {} status changed to: {}",
        property_state.property_name,
        if property_state.is_active {
            "ACTIVE"
        } else {
            "INACTIVE"
        }
    );

    Ok(())
}
