/// Update property metadata and details
use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{constants::*, error::RwaError, events::*, state::*};

#[derive(Accounts)]
pub struct UpdatePropertyDetails<'info> {
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

/// Handler for update_property_details instruction
pub fn handler(
    ctx: Context<UpdatePropertyDetails>,
    new_details: PropertyDetails,
) -> Result<()> {
    // Validate new property details
    new_details.validate()?;

    let property_state = &mut ctx.accounts.property_state;

    // Update property details
    property_state.details = new_details.clone();
    property_state.updated_at = Clock::get()?.unix_timestamp;

    // Get values before move
    let value_usd = new_details.total_value_usd;
    let yield_bps = new_details.rental_yield_bps;
    let property_address = new_details.property_address.clone();
    let value_dollars = new_details.total_value_usd_dollars();
    let yield_percent = new_details.rental_yield_percent();

    // Emit property updated event
    emit!(PropertyUpdated {
        mint: ctx.accounts.mint.key(),
        property_address,
        total_value_usd: value_usd,
        rental_yield_bps: yield_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Property details updated for {} - Value: ${} - Yield: {}%",
        property_state.property_name,
        value_dollars,
        yield_percent
    );

    Ok(())
}
