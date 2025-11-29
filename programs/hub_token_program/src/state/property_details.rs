/// Property metadata and details stored on-chain
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct PropertyDetails {
    /// Physical address of the property
    /// Example: "Av. Paulista, 1000, São Paulo - SP, Brazil"
    #[max_len(200)]
    pub property_address: String,

    /// Type of property
    /// Example: "Residential", "Commercial", "Industrial", "Mixed-Use"
    #[max_len(100)]
    pub property_type: String,

    /// Total property value in USD cents
    /// Example: 100_000_000 = $1,000,000 USD
    pub total_value_usd: u64,

    /// Annual rental yield in basis points
    /// Example: 500 = 5.00% annual yield
    /// Range: 0-10000 (0%-100%)
    pub rental_yield_bps: u16,

    /// URI pointing to off-chain metadata (IPFS/Arweave)
    /// Contains: legal documents, property photos, detailed specs
    /// Example: "ipfs://Qm..."
    #[max_len(500)]
    pub metadata_uri: String,
}

impl PropertyDetails {
    /// Validates property details constraints
    pub fn validate(&self) -> Result<()> {
        require!(
            self.property_address.len() <= 200,
            crate::error::RwaError::PropertyAddressTooLong
        );

        require!(
            self.property_type.len() <= 100,
            crate::error::RwaError::PropertyTypeTooLong
        );

        require!(
            self.metadata_uri.len() <= 500,
            crate::error::RwaError::MetadataUriTooLong
        );

        require!(
            self.rental_yield_bps <= crate::constants::MAX_RENTAL_YIELD_BPS,
            crate::error::RwaError::InvalidRentalYield
        );

        Ok(())
    }

    /// Returns the annual rental yield as a percentage
    /// Example: 500 bps -> 5.0%
    pub fn rental_yield_percent(&self) -> f64 {
        self.rental_yield_bps as f64 / 100.0
    }

    /// Returns the total property value in USD (dollars, not cents)
    pub fn total_value_usd_dollars(&self) -> f64 {
        self.total_value_usd as f64 / 100.0
    }
}
