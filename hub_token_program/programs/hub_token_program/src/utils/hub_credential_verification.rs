/// Hub Credential Protocol verification utilities
///
/// This module provides KYC verification using the Hub Credential Protocol.
/// Hub Credential is the primary KYC verification method for Hub Token transfers.
///
/// Hub Credential Protocol stores credentials as on-chain PDAs with the following data:
/// - user: Pubkey (32 bytes)
/// - issuer: Pubkey (32 bytes)
/// - credential_type: CredentialType enum (1 byte)
/// - status: CredentialStatus enum (1 byte)
/// - issued_at: i64 (8 bytes)
/// - expires_at: i64 (8 bytes)
/// - metadata: String (4 + variable length)
/// - bump: u8 (1 byte)
use anchor_lang::prelude::*;

use crate::{constants::HUB_CREDENTIAL_PROGRAM_ID, error::RwaError, events::*};

/// Credential Type enum matching the Hub Credential Protocol
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u8)]
pub enum HubCredentialType {
    KycBasic = 0,
    KycFull = 1,
    AccreditedInvestor = 2,
    QualifiedPurchaser = 3,
    BrazilianCpf = 4,
    BrazilianCnpj = 5,
}

impl HubCredentialType {
    fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(HubCredentialType::KycBasic),
            1 => Some(HubCredentialType::KycFull),
            2 => Some(HubCredentialType::AccreditedInvestor),
            3 => Some(HubCredentialType::QualifiedPurchaser),
            4 => Some(HubCredentialType::BrazilianCpf),
            5 => Some(HubCredentialType::BrazilianCnpj),
            _ => None,
        }
    }
}

/// Credential Status enum matching the Hub Credential Protocol
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u8)]
pub enum HubCredentialStatus {
    Active = 0,
    Expired = 1,
    Revoked = 2,
    Suspended = 3,
}

impl HubCredentialStatus {
    fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(HubCredentialStatus::Active),
            1 => Some(HubCredentialStatus::Expired),
            2 => Some(HubCredentialStatus::Revoked),
            3 => Some(HubCredentialStatus::Suspended),
            _ => None,
        }
    }
}

/// Hub Credential data structure (partial, only what we need)
pub struct HubCredential {
    pub user: Pubkey,
    pub issuer: Pubkey,
    pub credential_type: HubCredentialType,
    pub status: HubCredentialStatus,
    pub issued_at: i64,
    pub expires_at: i64,
}

impl HubCredential {
    /// Minimum size of credential account
    /// 8 (discriminator) + 32 (user) + 32 (issuer) + 1 (type) + 1 (status) + 8 (issued_at) + 8 (expires_at) = 90 bytes
    pub const MIN_SIZE: usize = 90;

    /// Parse credential from account data
    pub fn parse(data: &[u8]) -> Result<Self> {
        if data.len() < Self::MIN_SIZE {
            msg!("Hub Credential data too small: {} bytes", data.len());
            return Err(RwaError::KycVerificationRequired.into());
        }

        // Skip 8-byte Anchor discriminator
        let offset = 8;

        // user: Pubkey at offset 8
        let user = Pubkey::try_from(&data[offset..offset + 32])
            .map_err(|_| RwaError::KycVerificationRequired)?;

        // issuer: Pubkey at offset 40
        let issuer = Pubkey::try_from(&data[offset + 32..offset + 64])
            .map_err(|_| RwaError::KycVerificationRequired)?;

        // credential_type: u8 at offset 72
        let type_byte = data[offset + 64];
        let credential_type = HubCredentialType::from_u8(type_byte)
            .ok_or(RwaError::KycVerificationRequired)?;

        // status: u8 at offset 73
        let status_byte = data[offset + 65];
        let status = HubCredentialStatus::from_u8(status_byte)
            .ok_or(RwaError::KycVerificationRequired)?;

        // issued_at: i64 at offset 74
        let issued_at_bytes: [u8; 8] = data[offset + 66..offset + 74]
            .try_into()
            .map_err(|_| RwaError::KycVerificationRequired)?;
        let issued_at = i64::from_le_bytes(issued_at_bytes);

        // expires_at: i64 at offset 82
        let expires_at_bytes: [u8; 8] = data[offset + 74..offset + 82]
            .try_into()
            .map_err(|_| RwaError::KycVerificationRequired)?;
        let expires_at = i64::from_le_bytes(expires_at_bytes);

        Ok(HubCredential {
            user,
            issuer,
            credential_type,
            status,
            issued_at,
            expires_at,
        })
    }
}

/// Verifies that a wallet has a valid Hub Credential
///
/// # Arguments
/// * `credential_account` - The Hub Credential account
/// * `wallet` - The wallet address to verify
/// * `property_mint` - The property token mint (for event logging)
///
/// # Returns
/// * `Result<()>` - Ok if wallet has valid credential, Error otherwise
///
/// # Verification Steps
/// 1. Verify the account is owned by the Hub Credential program
/// 2. Parse and verify the credential belongs to the wallet
/// 3. Verify the credential is not expired
/// 4. Verify the credential status is Active
pub fn verify_hub_credential(
    credential_account: &AccountInfo,
    wallet: &Pubkey,
    _property_mint: &Pubkey,
) -> Result<()> {
    msg!("Verifying Hub Credential for wallet: {}", wallet);

    // 1. Verify account owner is the Hub Credential program
    if credential_account.owner != &HUB_CREDENTIAL_PROGRAM_ID {
        msg!(
            "Invalid credential account owner: expected {}, got {}",
            HUB_CREDENTIAL_PROGRAM_ID,
            credential_account.owner
        );
        return Err(RwaError::KycVerificationRequired.into());
    }

    // 2. Parse the credential
    let data = credential_account.try_borrow_data()?;
    let credential = HubCredential::parse(&data)?;

    // 3. Verify the credential belongs to the wallet
    if credential.user != *wallet {
        msg!(
            "Credential owner mismatch: expected {}, got {}",
            wallet,
            credential.user
        );
        return Err(RwaError::KycVerificationRequired.into());
    }

    // 4. Verify credential status is Active
    if credential.status != HubCredentialStatus::Active {
        msg!("Credential not active: status = {:?}", credential.status);
        return Err(match credential.status {
            HubCredentialStatus::Revoked => RwaError::CredentialRevoked.into(),
            HubCredentialStatus::Suspended => RwaError::CredentialSuspended.into(),
            HubCredentialStatus::Expired => RwaError::CredentialExpired.into(),
            _ => RwaError::KycVerificationRequired.into(),
        });
    }

    // 5. Check expiration
    let current_time = Clock::get()?.unix_timestamp;
    if current_time >= credential.expires_at {
        msg!(
            "Credential expired at {}, current time: {}",
            credential.expires_at,
            current_time
        );
        return Err(RwaError::CredentialExpired.into());
    }

    // Emit success event for audit trail
    emit!(HubCredentialVerified {
        wallet: *wallet,
        credential: credential_account.key(),
        credential_type: credential.credential_type as u8,
        timestamp: current_time,
    });

    msg!(
        "Hub Credential verified successfully for wallet: {}, type: {:?}",
        wallet,
        credential.credential_type
    );

    Ok(())
}

/// Derive the Hub Credential PDA for a wallet
///
/// Credential PDAs are derived from:
/// - "credential" literal
/// - The wallet address
///
/// Seeds: ["credential", wallet]
pub fn derive_hub_credential_pda(wallet: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"credential", wallet.as_ref()],
        &HUB_CREDENTIAL_PROGRAM_ID,
    )
}

/// Check if a Hub Credential exists for a wallet (without full verification)
pub fn hub_credential_exists(credential_account: &AccountInfo) -> bool {
    credential_account.data_len() >= HubCredential::MIN_SIZE
        && credential_account.owner == &HUB_CREDENTIAL_PROGRAM_ID
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_hub_credential_pda() {
        let wallet = Pubkey::new_unique();
        let (pda, _bump) = derive_hub_credential_pda(&wallet);

        // Verify PDA is deterministic
        let (pda2, _) = derive_hub_credential_pda(&wallet);
        assert_eq!(pda, pda2);
    }

    #[test]
    fn test_credential_type_from_u8() {
        assert_eq!(
            HubCredentialType::from_u8(0),
            Some(HubCredentialType::KycBasic)
        );
        assert_eq!(
            HubCredentialType::from_u8(1),
            Some(HubCredentialType::KycFull)
        );
        assert_eq!(
            HubCredentialType::from_u8(2),
            Some(HubCredentialType::AccreditedInvestor)
        );
        assert_eq!(HubCredentialType::from_u8(10), None);
    }

    #[test]
    fn test_credential_status_from_u8() {
        assert_eq!(
            HubCredentialStatus::from_u8(0),
            Some(HubCredentialStatus::Active)
        );
        assert_eq!(
            HubCredentialStatus::from_u8(2),
            Some(HubCredentialStatus::Revoked)
        );
        assert_eq!(HubCredentialStatus::from_u8(10), None);
    }
}
