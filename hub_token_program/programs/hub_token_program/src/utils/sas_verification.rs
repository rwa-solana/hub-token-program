/// Solana Attestation Service (SAS) verification utilities
use anchor_lang::prelude::*;
use crate::{error::RwaError, events::*};

/// SAS Attestation Account structure
/// Based on Solana Attestation Service specification
/// Reference: https://github.com/solana-foundation/solana-attestation-service
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct SasAttestation {
    /// The subject of the attestation (usually the investor's wallet)
    pub subject: Pubkey,

    /// The issuer of the attestation (KYC provider like Civic)
    pub issuer: Pubkey,

    /// Attestation data (claim hash)
    pub data: [u8; 32],

    /// Expiration timestamp (Unix timestamp)
    pub expiration: i64,

    /// Whether the attestation is active/valid
    pub is_valid: bool,

    /// Creation timestamp
    pub created_at: i64,

    /// Last update timestamp
    pub updated_at: i64,
}

/// Verifies SAS attestation for KYC compliance
///
/// # Arguments
/// * `attestation_account` - The SAS attestation account
/// * `investor` - The investor's public key
/// * `property_mint` - The property token mint
///
/// # Returns
/// * `Result<()>` - Ok if verification succeeds, Error otherwise
///
/// # Verification Steps
/// 1. Check account owner is SAS program
/// 2. Deserialize attestation data
/// 3. Verify subject matches investor
/// 4. Check attestation is not expired
/// 5. Verify attestation is marked as valid
pub fn verify_sas_attestation(
    attestation_account: &AccountInfo,
    investor: &Pubkey,
    property_mint: &Pubkey,
) -> Result<()> {
    // 1. Verify account owner is SAS program
    require!(
        attestation_account.owner == &crate::constants::SAS_PROGRAM_ID,
        RwaError::InvalidSasProgram
    );

    // 2. Deserialize attestation data
    let attestation_data = &attestation_account.try_borrow_data()?;

    // Skip discriminator (first 8 bytes for Anchor accounts)
    let attestation = SasAttestation::try_from_slice(&attestation_data[8..])?;

    // 3. Verify subject matches investor
    require!(
        attestation.subject == *investor,
        RwaError::KycVerificationRequired
    );

    // 4. Check attestation is not expired
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time < attestation.expiration,
        RwaError::SasAttestationExpired
    );

    // 5. Verify attestation is marked as valid
    require!(
        attestation.is_valid,
        RwaError::SasAttestationNotVerified
    );

    // Emit success event for audit trail
    emit!(SasVerificationSuccess {
        investor: *investor,
        property: *property_mint,
        attestation: attestation_account.key(),
        timestamp: current_time,
    });

    Ok(())
}

/// Verifies SAS attestation with optional grace period
/// Useful for renewals
pub fn verify_sas_attestation_with_grace_period(
    attestation_account: &AccountInfo,
    investor: &Pubkey,
    property_mint: &Pubkey,
    grace_period_seconds: i64,
) -> Result<()> {
    // Verify account owner is SAS program
    require!(
        attestation_account.owner == &crate::constants::SAS_PROGRAM_ID,
        RwaError::InvalidSasProgram
    );

    // Deserialize attestation data
    let attestation_data = &attestation_account.try_borrow_data()?;
    let attestation = SasAttestation::try_from_slice(&attestation_data[8..])?;

    // Verify subject matches investor
    require!(
        attestation.subject == *investor,
        RwaError::KycVerificationRequired
    );

    // Check attestation with grace period
    let current_time = Clock::get()?.unix_timestamp;
    let expiration_with_grace = attestation.expiration + grace_period_seconds;

    require!(
        current_time < expiration_with_grace,
        RwaError::SasAttestationExpired
    );

    // Verify attestation is valid
    require!(
        attestation.is_valid,
        RwaError::SasAttestationNotVerified
    );

    emit!(SasVerificationSuccess {
        investor: *investor,
        property: *property_mint,
        attestation: attestation_account.key(),
        timestamp: current_time,
    });

    Ok(())
}

/// Checks if attestation exists and is owned by SAS program
/// Does not verify validity or expiration
pub fn is_sas_attestation(account: &AccountInfo) -> bool {
    account.owner == &crate::constants::SAS_PROGRAM_ID
}

/// Returns attestation expiration time if valid
pub fn get_attestation_expiration(attestation_account: &AccountInfo) -> Result<i64> {
    require!(
        attestation_account.owner == &crate::constants::SAS_PROGRAM_ID,
        RwaError::InvalidSasProgram
    );

    let attestation_data = &attestation_account.try_borrow_data()?;
    let attestation = SasAttestation::try_from_slice(&attestation_data[8..])?;

    Ok(attestation.expiration)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_attestation_structure_size() {
        // Ensure SasAttestation fits within expected size
        let size = std::mem::size_of::<SasAttestation>();
        assert!(size < 200, "SasAttestation too large: {} bytes", size);
    }
}
