/// Program constants and seeds for PDA derivation
use anchor_lang::prelude::*;

declare_id!("Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHSVerteR");

/// Seed for PropertyState PDA derivation
pub const PROPERTY_STATE_SEED: &[u8] = b"property";

/// Seed for PropertyVault PDA (future use for revenue distribution)
pub const PROPERTY_VAULT_SEED: &[u8] = b"property_vault";

/// Maximum length for property name
pub const MAX_PROPERTY_NAME_LEN: usize = 50;

/// Maximum length for property symbol (ticker)
pub const MAX_PROPERTY_SYMBOL_LEN: usize = 10;

/// Maximum length for property address
pub const MAX_PROPERTY_ADDRESS_LEN: usize = 200;

/// Maximum length for property type description
pub const MAX_PROPERTY_TYPE_LEN: usize = 100;

/// Maximum length for metadata URI (IPFS/Arweave)
pub const MAX_METADATA_URI_LEN: usize = 500;

/// Solana Attestation Service Program ID
/// TODO: Update with actual SAS program ID once deployed
pub const SAS_PROGRAM_ID: Pubkey = ID;

/// Minimum rental yield in basis points (0.01% = 1 bps)
pub const MIN_RENTAL_YIELD_BPS: u16 = 0;

/// Maximum rental yield in basis points (100% = 10000 bps)
pub const MAX_RENTAL_YIELD_BPS: u16 = 10000;
