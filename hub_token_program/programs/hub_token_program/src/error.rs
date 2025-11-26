/// Custom errors for the RWA Tokenization Program
use anchor_lang::prelude::*;

#[error_code]
pub enum RwaError {
    #[msg("Unauthorized: Only property authority can perform this action")]
    Unauthorized,

    #[msg("Property name too long (max 50 characters)")]
    PropertyNameTooLong,

    #[msg("Property symbol too long (max 10 characters)")]
    PropertySymbolTooLong,

    #[msg("Invalid total supply: must be greater than zero")]
    InvalidTotalSupply,

    #[msg("Exceeds maximum supply: cannot mint more tokens than total supply")]
    ExceedsMaxSupply,

    #[msg("Property is not active: minting is disabled")]
    PropertyNotActive,

    #[msg("Invalid mint account")]
    InvalidMint,

    #[msg("KYC verification required: SAS attestation not found or invalid")]
    KycVerificationRequired,

    #[msg("Invalid rental yield: must be between 0 and 10000 basis points (0-100%)")]
    InvalidRentalYield,

    #[msg("SAS attestation expired")]
    SasAttestationExpired,

    #[msg("SAS attestation not verified")]
    SasAttestationNotVerified,

    #[msg("Invalid SAS program")]
    InvalidSasProgram,

    #[msg("Property address too long")]
    PropertyAddressTooLong,

    #[msg("Property type too long")]
    PropertyTypeTooLong,

    #[msg("Metadata URI too long")]
    MetadataUriTooLong,

    #[msg("Insufficient token balance for burn operation")]
    InsufficientBalance,
}
