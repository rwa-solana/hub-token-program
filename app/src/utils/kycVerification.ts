/**
 * KYC Verification Utilities for Hub Token Marketplace
 *
 * This module provides utilities for verifying KYC status using Hub Credential Protocol.
 */

import { PublicKey, Connection } from '@solana/web3.js';

// Program IDs
export const HUB_CREDENTIAL_PROGRAM_ID = new PublicKey('FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt');

/**
 * Credential status
 */
export enum CredentialStatus {
  Active = 'active',
  Expired = 'expired',
  Revoked = 'revoked',
  Suspended = 'suspended',
  NotFound = 'not_found',
}

/**
 * Credential types
 */
export enum CredentialType {
  KycBasic = 'kycBasic',
  KycFull = 'kycFull',
  AccreditedInvestor = 'accreditedInvestor',
  QualifiedPurchaser = 'qualifiedPurchaser',
  BrazilianCpf = 'brazilianCpf',
  BrazilianCnpj = 'brazilianCnpj',
}

/**
 * KYC verification result
 */
export interface KycVerificationResult {
  isValid: boolean;
  status: CredentialStatus;
  expiresAt?: Date;
  credentialType?: CredentialType;
  error?: string;
}

/**
 * Derive the Hub Credential PDA for a wallet
 */
export function deriveHubCredentialPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), wallet.toBuffer()],
    HUB_CREDENTIAL_PROGRAM_ID
  );
}

/**
 * Check if a wallet has a valid Hub Credential
 */
export async function checkHubCredential(
  connection: Connection,
  wallet: PublicKey
): Promise<KycVerificationResult> {
  try {
    const [credentialPDA] = deriveHubCredentialPDA(wallet);
    const accountInfo = await connection.getAccountInfo(credentialPDA);

    if (!accountInfo) {
      return {
        isValid: false,
        status: CredentialStatus.NotFound,
        error: 'Hub Credential not found',
      };
    }

    if (!accountInfo.owner.equals(HUB_CREDENTIAL_PROGRAM_ID)) {
      return {
        isValid: false,
        status: CredentialStatus.NotFound,
        error: 'Invalid account owner',
      };
    }

    // Parse credential data
    const data = accountInfo.data;
    if (data.length < 90) {
      return {
        isValid: false,
        status: CredentialStatus.NotFound,
        error: 'Invalid credential data',
      };
    }

    // Skip 8-byte Anchor discriminator
    const offset = 8;

    // Parse credential_type at offset 64
    const typeByte = data[offset + 64];
    const credentialTypes: CredentialType[] = [
      CredentialType.KycBasic,
      CredentialType.KycFull,
      CredentialType.AccreditedInvestor,
      CredentialType.QualifiedPurchaser,
      CredentialType.BrazilianCpf,
      CredentialType.BrazilianCnpj,
    ];
    const credentialType = credentialTypes[typeByte] || CredentialType.KycBasic;

    // Parse status at offset 65
    const statusByte = data[offset + 65];
    let status: CredentialStatus;
    switch (statusByte) {
      case 0:
        status = CredentialStatus.Active;
        break;
      case 1:
        status = CredentialStatus.Expired;
        break;
      case 2:
        status = CredentialStatus.Revoked;
        break;
      case 3:
        status = CredentialStatus.Suspended;
        break;
      default:
        status = CredentialStatus.NotFound;
    }

    // Parse expires_at at offset 74
    const expiresAtBytes = data.slice(offset + 74, offset + 82);
    const expiresAtTimestamp = Number(
      BigInt.asIntN(64, BigInt('0x' + Buffer.from(expiresAtBytes).reverse().toString('hex')))
    );
    const expiresAt = new Date(expiresAtTimestamp * 1000);

    // Check if expired
    const now = new Date();
    if (expiresAt < now) {
      return {
        isValid: false,
        status: CredentialStatus.Expired,
        expiresAt,
        credentialType,
        error: 'Credential has expired',
      };
    }

    // Check if active
    if (status !== CredentialStatus.Active) {
      return {
        isValid: false,
        status,
        expiresAt,
        credentialType,
        error: `Credential is ${status}`,
      };
    }

    return {
      isValid: true,
      status: CredentialStatus.Active,
      expiresAt,
      credentialType,
    };
  } catch (error: any) {
    return {
      isValid: false,
      status: CredentialStatus.NotFound,
      error: error.message,
    };
  }
}

/**
 * Verify KYC status for a wallet
 * Alias for checkHubCredential for backwards compatibility
 */
export async function verifyKyc(
  connection: Connection,
  wallet: PublicKey
): Promise<KycVerificationResult> {
  return checkHubCredential(connection, wallet);
}

/**
 * Get the KYC verification account PDA for transfers
 * Returns the credential PDA that should be passed to the transfer hook
 */
export async function getKycAccountForTransfer(
  connection: Connection,
  wallet: PublicKey
): Promise<PublicKey | null> {
  const [credentialPDA] = deriveHubCredentialPDA(wallet);
  const result = await checkHubCredential(connection, wallet);

  if (result.isValid) {
    return credentialPDA;
  }

  return null;
}
