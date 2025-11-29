//! # HUB Token - Real Estate Tokenization Program
//!
//! A professional Solana program for tokenizing real estate properties (RWA - Real World Assets)
//! with KYC/compliance verification via Solana Attestation Service (SAS).
//!
//! ## Features
//! - Token-2022 based property tokens
//! - KYC verification via SAS + Civic Pass
//! - Fractional ownership
//! - On-chain audit trails
//! - Property metadata management
//!
//! ## Architecture
//! ```text
//! Property -> Token Mint (Token-2022)
//!          -> PropertyState PDA (metadata, supply)
//!          -> Investor Tokens (fractional ownership)
//!          -> SAS Attestations (KYC verification)
//! ```

use anchor_lang::prelude::*;

// Module declarations
pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

// Re-exports for convenience
pub use constants::*;
pub use error::*;
pub use events::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

declare_id!("FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om");

#[program]
pub mod hub_token_program {
    use super::*;

    /// Create a new property mint with TransferHook extension
    ///
    /// This is the recommended way to create a property as it:
    /// 1. Creates a Token-2022 mint with TransferHook extension
    /// 2. Initializes PropertyState PDA
    /// 3. Initializes ExtraAccountMetaList for transfer verification
    ///
    /// All subsequent transfers will automatically verify KYC via transfer_hook_execute.
    ///
    /// # Arguments
    /// * `property_name` - Human-readable name (max 50 chars)
    /// * `property_symbol` - Token ticker (max 10 chars)
    /// * `decimals` - Token decimals (typically 6)
    /// * `total_supply` - Maximum tokens that can be minted
    /// * `property_details` - Metadata about the property
    pub fn create_property_mint(
        ctx: Context<CreatePropertyMint>,
        property_name: String,
        property_symbol: String,
        decimals: u8,
        total_supply: u64,
        property_details: PropertyDetails,
    ) -> Result<()> {
        instructions::create_property_mint::handler(
            ctx,
            property_name,
            property_symbol,
            decimals,
            total_supply,
            property_details,
        )
    }

    /// Mint property tokens to an investor
    ///
    /// Requires valid KYC via SAS attestation.
    /// Only the property authority can mint tokens.
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to mint
    ///
    /// # Security
    /// - Verifies SAS attestation exists and is valid
    /// - Checks attestation has not expired
    /// - Ensures property is active
    /// - Validates total supply limit
    pub fn mint_property_tokens(
        ctx: Context<MintPropertyTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::mint_property_tokens::handler(ctx, amount)
    }

    /// Burn property tokens (redemption/exit)
    ///
    /// Allows investors to burn their tokens, reducing circulating supply.
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to burn
    pub fn burn_property_tokens(
        ctx: Context<BurnPropertyTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::burn_property_tokens::handler(ctx, amount)
    }

    /// Update property metadata
    ///
    /// Only the property authority can update details.
    ///
    /// # Arguments
    /// * `new_details` - Updated property metadata
    pub fn update_property_details(
        ctx: Context<UpdatePropertyDetails>,
        new_details: PropertyDetails,
    ) -> Result<()> {
        instructions::update_property_details::handler(ctx, new_details)
    }

    /// Toggle property active status
    ///
    /// Enables or disables token minting for this property.
    /// Only the property authority can toggle status.
    pub fn toggle_property_status(
        ctx: Context<TogglePropertyStatus>,
    ) -> Result<()> {
        instructions::toggle_property_status::handler(ctx)
    }

    /// Initialize the ExtraAccountMetaList for Transfer Hook
    ///
    /// This must be called after creating a mint with the TransferHook extension.
    /// It defines which additional accounts are required during transfers
    /// (specifically, the destination wallet's SAS attestation for KYC verification).
    pub fn initialize_extra_account_metas(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        instructions::transfer_hook::handler_initialize_extra_account_metas(ctx)
    }

    /// Transfer Hook Execute - KYC verification on transfers
    ///
    /// This instruction is automatically called by Token-2022 during every transfer.
    /// It verifies that the destination wallet has valid KYC (SAS attestation).
    ///
    /// # Security
    /// - Verifies SAS attestation exists for destination wallet
    /// - Checks attestation has not expired
    /// - Ensures destination is not a sanctioned wallet
    /// - Blocks transfers to non-compliant wallets
    pub fn transfer_hook_execute(
        ctx: Context<TransferHook>,
        amount: u64,
    ) -> Result<()> {
        instructions::transfer_hook::handler(ctx, amount)
    }

    // ========================================================================
    // REVENUE VAULT - Dividend Distribution
    // ========================================================================

    /// Deposit rental revenue for distribution to token holders
    ///
    /// Creates a new revenue epoch and deposits SOL into the vault.
    /// Token holders can then claim their proportional share.
    ///
    /// # Arguments
    /// * `epoch_number` - Sequential epoch number for this distribution
    /// * `amount` - Amount of SOL (in lamports) to deposit
    ///
    /// # Access Control
    /// - Only property authority can deposit revenue
    /// - Property must be active
    /// - Must have token holders (circulating supply > 0)
    pub fn deposit_revenue(
        ctx: Context<DepositRevenue>,
        epoch_number: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::revenue_vault::handler_deposit_revenue(ctx, epoch_number, amount)
    }

    /// Claim proportional share of revenue for an epoch
    ///
    /// Token holders call this to receive their dividend based on their
    /// token balance at the time of deposit.
    ///
    /// # Calculation
    /// `claim_amount = (investor_balance / eligible_supply) * total_revenue`
    ///
    /// # Access Control
    /// - Must hold property tokens
    /// - Can only claim each epoch once
    /// - Epoch must be finalized
    pub fn claim_revenue(ctx: Context<ClaimRevenue>) -> Result<()> {
        instructions::revenue_vault::handler_claim_revenue(ctx)
    }
}
