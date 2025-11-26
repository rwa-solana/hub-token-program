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

declare_id!("CA7Z9VgsUuDWZreqaUfJztBgEgi6ksW9iyW9pjvMarKU");

#[program]
pub mod hub_token_program {
    use super::*;

    /// Initialize a new tokenized real estate property
    ///
    /// Creates a Token-2022 mint and PropertyState PDA for a new property.
    ///
    /// # Arguments
    /// * `decimals` - Token decimals (typically 6)
    /// * `property_name` - Human-readable name (max 50 chars)
    /// * `property_symbol` - Token ticker (max 10 chars)
    /// * `total_supply` - Maximum tokens that can be minted
    /// * `property_details` - Metadata about the property
    ///
    /// # Example
    /// ```ignore
    /// initialize_property(
    ///     6,
    ///     "Edifício Santos Dumont",
    ///     "EDSANTO",
    ///     1_000_000,
    ///     PropertyDetails {
    ///         property_address: "Av. Paulista, 1000, São Paulo - SP",
    ///         property_type: "Commercial",
    ///         total_value_usd: 100_000_000, // $1M in cents
    ///         rental_yield_bps: 800, // 8% annual yield
    ///         metadata_uri: "ipfs://...",
    ///     }
    /// )
    /// ```
    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        decimals: u8,
        property_name: String,
        property_symbol: String,
        total_supply: u64,
        property_details: PropertyDetails,
    ) -> Result<()> {
        instructions::initialize_property::handler(
            ctx,
            decimals,
            property_name,
            property_symbol,
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
}
