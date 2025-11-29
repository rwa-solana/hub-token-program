/// Events emitted by the RWA Tokenization Program for audit trails
use anchor_lang::prelude::*;

#[event]
pub struct PropertyInitialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub property_name: String,
    pub property_symbol: String,
    pub total_supply: u64,
    pub property_address: String,
    pub timestamp: i64,
}

#[event]
pub struct TokensMinted {
    pub mint: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensBurned {
    pub mint: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct PropertyUpdated {
    pub mint: Pubkey,
    pub property_address: String,
    pub total_value_usd: u64,
    pub rental_yield_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct PropertyStatusChanged {
    pub mint: Pubkey,
    pub is_active: bool,
    pub timestamp: i64,
}

/// Event emitted when Hub Credential verification succeeds
#[event]
pub struct HubCredentialVerified {
    pub wallet: Pubkey,
    pub credential: Pubkey,
    pub credential_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct TransferKycVerified {
    pub mint: Pubkey,
    pub source: Pubkey,
    pub destination: Pubkey,
    pub destination_owner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ExtraAccountMetasInitialized {
    pub mint: Pubkey,
    pub extra_account_meta_list: Pubkey,
    pub timestamp: i64,
}
