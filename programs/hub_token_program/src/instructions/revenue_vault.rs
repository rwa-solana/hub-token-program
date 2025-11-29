/// Revenue Vault - Dividend Distribution System
///
/// Allows property owners to deposit rental revenue and token holders
/// to claim their proportional share of dividends.
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_interface::{Mint, TokenAccount};

use crate::{error::RwaError, state::*};

/// Revenue distribution epoch - tracks a single distribution period
#[account]
#[derive(InitSpace)]
pub struct RevenueEpoch {
    /// The property this epoch belongs to
    pub property_state: Pubkey,
    /// Epoch number (incrementing)
    pub epoch_number: u64,
    /// Total revenue deposited for this epoch (in lamports)
    pub total_revenue: u64,
    /// Total tokens eligible at time of deposit (snapshot)
    pub eligible_supply: u64,
    /// Timestamp when revenue was deposited
    pub deposited_at: i64,
    /// Authority who deposited
    pub deposited_by: Pubkey,
    /// Whether this epoch is finalized (no more deposits)
    pub is_finalized: bool,
    /// Bump seed
    pub bump: u8,
}

/// Tracks individual investor claims for an epoch
#[account]
#[derive(InitSpace)]
pub struct ClaimRecord {
    /// The epoch this claim is for
    pub epoch: Pubkey,
    /// The investor who claimed
    pub investor: Pubkey,
    /// Amount claimed (in lamports)
    pub amount_claimed: u64,
    /// Timestamp of claim
    pub claimed_at: i64,
    /// Bump seed
    pub bump: u8,
}

/// Seed for RevenueEpoch PDA
pub const REVENUE_EPOCH_SEED: &[u8] = b"revenue_epoch";

/// Seed for ClaimRecord PDA
pub const CLAIM_RECORD_SEED: &[u8] = b"claim_record";

/// Seed for Revenue Vault PDA (holds SOL)
pub const REVENUE_VAULT_SEED: &[u8] = b"revenue_vault";

// ============================================================================
// DEPOSIT REVENUE
// ============================================================================

#[derive(Accounts)]
#[instruction(epoch_number: u64)]
pub struct DepositRevenue<'info> {
    /// Property authority depositing revenue
    #[account(mut)]
    pub authority: Signer<'info>,

    /// PropertyState - must be authority
    #[account(
        constraint = property_state.authority == authority.key() @ RwaError::Unauthorized,
        constraint = property_state.is_active @ RwaError::PropertyNotActive,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property mint
    #[account(
        constraint = property_state.mint == mint.key() @ RwaError::InvalidMint,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Revenue Epoch PDA - created for each distribution period
    #[account(
        init,
        payer = authority,
        space = 8 + RevenueEpoch::INIT_SPACE,
        seeds = [REVENUE_EPOCH_SEED, property_state.key().as_ref(), &epoch_number.to_le_bytes()],
        bump,
    )]
    pub revenue_epoch: Box<Account<'info, RevenueEpoch>>,

    /// Revenue Vault PDA - holds the SOL for this epoch
    /// CHECK: PDA that holds SOL, validated by seeds
    #[account(
        mut,
        seeds = [REVENUE_VAULT_SEED, revenue_epoch.key().as_ref()],
        bump,
    )]
    pub revenue_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Deposit rental revenue for distribution to token holders
pub fn handler_deposit_revenue(
    ctx: Context<DepositRevenue>,
    epoch_number: u64,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, RwaError::InvalidAmount);

    let property_state = &ctx.accounts.property_state;

    // Snapshot the current circulating supply for fair distribution
    let eligible_supply = property_state.circulating_supply;
    require!(eligible_supply > 0, RwaError::NoTokenHolders);

    // Initialize the revenue epoch
    let revenue_epoch = &mut ctx.accounts.revenue_epoch;
    revenue_epoch.property_state = property_state.key();
    revenue_epoch.epoch_number = epoch_number;
    revenue_epoch.total_revenue = amount;
    revenue_epoch.eligible_supply = eligible_supply;
    revenue_epoch.deposited_at = Clock::get()?.unix_timestamp;
    revenue_epoch.deposited_by = ctx.accounts.authority.key();
    revenue_epoch.is_finalized = true; // Single deposit per epoch
    revenue_epoch.bump = ctx.bumps.revenue_epoch;

    // Transfer SOL from authority to revenue vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.revenue_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, amount)?;

    msg!(
        "Revenue deposited: {} lamports for epoch {} (eligible supply: {})",
        amount,
        epoch_number,
        eligible_supply
    );

    // Emit event
    emit!(RevenueDeposited {
        property: property_state.key(),
        epoch: revenue_epoch.key(),
        epoch_number,
        amount,
        eligible_supply,
        deposited_by: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// ============================================================================
// CLAIM REVENUE
// ============================================================================

#[derive(Accounts)]
pub struct ClaimRevenue<'info> {
    /// Investor claiming their share
    #[account(mut)]
    pub investor: Signer<'info>,

    /// PropertyState
    #[account()]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// The property mint
    #[account(
        constraint = property_state.mint == mint.key() @ RwaError::InvalidMint,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account - to verify balance
    #[account(
        constraint = investor_token_account.owner == investor.key() @ RwaError::Unauthorized,
        constraint = investor_token_account.mint == mint.key() @ RwaError::InvalidMint,
    )]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Revenue Epoch being claimed from
    #[account(
        constraint = revenue_epoch.property_state == property_state.key() @ RwaError::InvalidEpoch,
        constraint = revenue_epoch.is_finalized @ RwaError::EpochNotFinalized,
    )]
    pub revenue_epoch: Box<Account<'info, RevenueEpoch>>,

    /// Claim Record PDA - proves investor hasn't claimed this epoch yet
    #[account(
        init,
        payer = investor,
        space = 8 + ClaimRecord::INIT_SPACE,
        seeds = [CLAIM_RECORD_SEED, revenue_epoch.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub claim_record: Box<Account<'info, ClaimRecord>>,

    /// Revenue Vault PDA - holds the SOL
    /// CHECK: PDA that holds SOL, validated by seeds
    #[account(
        mut,
        seeds = [REVENUE_VAULT_SEED, revenue_epoch.key().as_ref()],
        bump,
    )]
    pub revenue_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Claim proportional share of revenue for an epoch
pub fn handler_claim_revenue(ctx: Context<ClaimRevenue>) -> Result<()> {
    let revenue_epoch = &ctx.accounts.revenue_epoch;
    let investor_balance = ctx.accounts.investor_token_account.amount;

    // Must have tokens to claim
    require!(investor_balance > 0, RwaError::InsufficientBalance);

    // Calculate proportional share
    // claim_amount = (investor_balance / eligible_supply) * total_revenue
    // Using u128 to prevent overflow
    let claim_amount = (investor_balance as u128)
        .checked_mul(revenue_epoch.total_revenue as u128)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(revenue_epoch.eligible_supply as u128)
        .ok_or(RwaError::MathOverflow)? as u64;

    require!(claim_amount > 0, RwaError::ClaimTooSmall);

    // Verify vault has enough balance
    let vault_balance = ctx.accounts.revenue_vault.lamports();
    require!(vault_balance >= claim_amount, RwaError::InsufficientVaultBalance);

    // Record the claim
    let claim_record = &mut ctx.accounts.claim_record;
    claim_record.epoch = revenue_epoch.key();
    claim_record.investor = ctx.accounts.investor.key();
    claim_record.amount_claimed = claim_amount;
    claim_record.claimed_at = Clock::get()?.unix_timestamp;
    claim_record.bump = ctx.bumps.claim_record;

    // Transfer SOL from vault to investor
    // Direct lamport manipulation (vault is a PDA we control)

    // Transfer lamports from vault PDA to investor
    **ctx.accounts.revenue_vault.to_account_info().try_borrow_mut_lamports()? -= claim_amount;
    **ctx.accounts.investor.to_account_info().try_borrow_mut_lamports()? += claim_amount;

    msg!(
        "Revenue claimed: {} lamports by {} (balance: {}, supply: {})",
        claim_amount,
        ctx.accounts.investor.key(),
        investor_balance,
        revenue_epoch.eligible_supply
    );

    // Emit event
    emit!(RevenueClaimed {
        property: ctx.accounts.property_state.key(),
        epoch: revenue_epoch.key(),
        epoch_number: revenue_epoch.epoch_number,
        investor: ctx.accounts.investor.key(),
        amount: claim_amount,
        investor_balance,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct RevenueDeposited {
    pub property: Pubkey,
    pub epoch: Pubkey,
    pub epoch_number: u64,
    pub amount: u64,
    pub eligible_supply: u64,
    pub deposited_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RevenueClaimed {
    pub property: Pubkey,
    pub epoch: Pubkey,
    pub epoch_number: u64,
    pub investor: Pubkey,
    pub amount: u64,
    pub investor_balance: u64,
    pub timestamp: i64,
}
