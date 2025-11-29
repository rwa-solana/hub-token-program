/// Main state account for tokenized real estate properties
use anchor_lang::prelude::*;
use super::PropertyDetails;

#[account]
#[derive(InitSpace, Debug)]
pub struct PropertyState {
    /// Authority who can mint tokens and update property details
    pub authority: Pubkey,

    /// Token-2022 mint address for this property
    pub mint: Pubkey,

    /// Human-readable property name
    /// Example: "Edif\u00edcio Santos Dumont"
    #[max_len(50)]
    pub property_name: String,

    /// Token symbol/ticker
    /// Example: "EDSANTO"
    #[max_len(10)]
    pub property_symbol: String,

    /// Maximum number of tokens that can be minted
    pub total_supply: u64,

    /// Current number of tokens in circulation
    pub circulating_supply: u64,

    /// Detailed property information
    pub details: PropertyDetails,

    /// Whether minting is currently enabled
    pub is_active: bool,

    /// Timestamp when property was tokenized
    pub created_at: i64,

    /// Timestamp of last update
    pub updated_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl PropertyState {
    /// Checks if more tokens can be minted
    pub fn can_mint(&self, amount: u64) -> bool {
        self.is_active && self.circulating_supply + amount <= self.total_supply
    }

    /// Returns the remaining tokens that can be minted
    pub fn remaining_supply(&self) -> u64 {
        self.total_supply.saturating_sub(self.circulating_supply)
    }

    /// Returns the percentage of tokens currently circulating
    pub fn circulation_percentage(&self) -> f64 {
        if self.total_supply == 0 {
            0.0
        } else {
            (self.circulating_supply as f64 / self.total_supply as f64) * 100.0
        }
    }

    /// Calculates the value per token in USD cents
    pub fn value_per_token_cents(&self) -> u64 {
        if self.total_supply == 0 {
            0
        } else {
            self.details.total_value_usd / self.total_supply
        }
    }
}
