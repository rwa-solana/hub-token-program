const fs = require('fs');
const crypto = require('crypto');

// Função para calcular discriminator (Anchor usa snake_case nos nomes)
function calculateDiscriminator(namespace, name) {
  const preimage = `${namespace}:${name}`;
  const hash = crypto.createHash('sha256').update(preimage).digest();
  return Array.from(hash.slice(0, 8));
}

// IDL completo baseado no código fonte
const idl = {
  "address": "Fmqd2M8VMepCQAAXJJ3mUS7sEL9FaFUkX7t5Zrt9Xu2Z",
  "metadata": {
    "name": "hub_token_program",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "createPropertyMint",
      "discriminator": calculateDiscriminator('global', 'create_property_mint'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "mint", "writable": true, "signer": true },
        { "name": "propertyState", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [112, 114, 111, 112, 101, 114, 116, 121] }, { "kind": "account", "path": "mint" }] } },
        { "name": "extraAccountMetaList", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [101, 120, 116, 114, 97, 45, 97, 99, 99, 111, 117, 110, 116, 45, 109, 101, 116, 97, 115] }, { "kind": "account", "path": "mint" }] } },
        { "name": "tokenProgram", "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "propertyName", "type": "string" },
        { "name": "propertySymbol", "type": "string" },
        { "name": "decimals", "type": "u8" },
        { "name": "totalSupply", "type": "u64" },
        { "name": "propertyDetails", "type": { "defined": { "name": "PropertyDetails" } } }
      ]
    },
    {
      "name": "mintPropertyTokens",
      "discriminator": calculateDiscriminator('global', 'mint_property_tokens'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "investor" },
        { "name": "propertyState", "writable": true },
        { "name": "mint", "writable": true },
        { "name": "investorTokenAccount", "writable": true },
        { "name": "investorAttestation" },
        { "name": "tokenProgram" },
        { "name": "associatedTokenProgram" },
        { "name": "systemProgram" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "burnPropertyTokens",
      "discriminator": calculateDiscriminator('global', 'burn_property_tokens'),
      "accounts": [
        { "name": "investor", "writable": true, "signer": true },
        { "name": "propertyState", "writable": true },
        { "name": "mint", "writable": true },
        { "name": "investorTokenAccount", "writable": true },
        { "name": "tokenProgram" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "updatePropertyDetails",
      "discriminator": calculateDiscriminator('global', 'update_property_details'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "propertyState", "writable": true },
        { "name": "mint" }
      ],
      "args": [
        { "name": "newDetails", "type": { "defined": { "name": "PropertyDetails" } } }
      ]
    },
    {
      "name": "togglePropertyStatus",
      "discriminator": calculateDiscriminator('global', 'toggle_property_status'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "propertyState", "writable": true },
        { "name": "mint" }
      ],
      "args": []
    },
    {
      "name": "initializeExtraAccountMetas",
      "discriminator": calculateDiscriminator('global', 'initialize_extra_account_metas'),
      "accounts": [
        { "name": "payer", "writable": true, "signer": true },
        { "name": "extraAccountMetaList", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [101, 120, 116, 114, 97, 45, 97, 99, 99, 111, 117, 110, 116, 45, 109, 101, 116, 97, 115] }, { "kind": "account", "path": "mint" }] } },
        { "name": "mint" },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "transferHookExecute",
      "discriminator": calculateDiscriminator('global', 'transfer_hook_execute'),
      "accounts": [
        { "name": "sourceAccount" },
        { "name": "mint" },
        { "name": "destinationAccount" },
        { "name": "owner" },
        { "name": "extraAccountMetaList", "pda": { "seeds": [{ "kind": "const", "value": [101, 120, 116, 114, 97, 45, 97, 99, 99, 111, 117, 110, 116, 45, 109, 101, 116, 97, 115] }, { "kind": "account", "path": "mint" }] } },
        { "name": "destinationAttestation" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "depositRevenue",
      "discriminator": calculateDiscriminator('global', 'deposit_revenue'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "propertyState" },
        { "name": "mint" },
        { "name": "revenueEpoch", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [114, 101, 118, 101, 110, 117, 101, 95, 101, 112, 111, 99, 104] }, { "kind": "account", "path": "propertyState" }, { "kind": "arg", "path": "epochNumber" }] } },
        { "name": "revenueVault", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [114, 101, 118, 101, 110, 117, 101, 95, 118, 97, 117, 108, 116] }, { "kind": "account", "path": "revenueEpoch" }] } },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "epochNumber", "type": "u64" },
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "claimRevenue",
      "discriminator": calculateDiscriminator('global', 'claim_revenue'),
      "accounts": [
        { "name": "investor", "writable": true, "signer": true },
        { "name": "propertyState" },
        { "name": "mint" },
        { "name": "investorTokenAccount" },
        { "name": "revenueEpoch" },
        { "name": "claimRecord", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 108, 97, 105, 109, 95, 114, 101, 99, 111, 114, 100] }, { "kind": "account", "path": "revenueEpoch" }, { "kind": "account", "path": "investor" }] } },
        { "name": "revenueVault", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [114, 101, 118, 101, 110, 117, 101, 95, 118, 97, 117, 108, 116] }, { "kind": "account", "path": "revenueEpoch" }] } },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "PropertyState",
      "discriminator": calculateDiscriminator('account', 'PropertyState')
    },
    {
      "name": "RevenueEpoch",
      "discriminator": calculateDiscriminator('account', 'RevenueEpoch')
    },
    {
      "name": "ClaimRecord",
      "discriminator": calculateDiscriminator('account', 'ClaimRecord')
    }
  ],
  "types": [
    {
      "name": "PropertyState",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "pubkey" },
          { "name": "mint", "type": "pubkey" },
          { "name": "propertyName", "type": "string" },
          { "name": "propertySymbol", "type": "string" },
          { "name": "totalSupply", "type": "u64" },
          { "name": "circulatingSupply", "type": "u64" },
          { "name": "details", "type": { "defined": { "name": "PropertyDetails" } } },
          { "name": "isActive", "type": "bool" },
          { "name": "createdAt", "type": "i64" },
          { "name": "updatedAt", "type": "i64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "PropertyDetails",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "propertyAddress", "type": "string" },
          { "name": "propertyType", "type": "string" },
          { "name": "totalValueUsd", "type": "u64" },
          { "name": "rentalYieldBps", "type": "u16" },
          { "name": "metadataUri", "type": "string" }
        ]
      }
    },
    {
      "name": "RevenueEpoch",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "propertyState", "type": "pubkey" },
          { "name": "epochNumber", "type": "u64" },
          { "name": "totalRevenue", "type": "u64" },
          { "name": "eligibleSupply", "type": "u64" },
          { "name": "depositedAt", "type": "i64" },
          { "name": "depositedBy", "type": "pubkey" },
          { "name": "isFinalized", "type": "bool" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "ClaimRecord",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "epoch", "type": "pubkey" },
          { "name": "investor", "type": "pubkey" },
          { "name": "amountClaimed", "type": "u64" },
          { "name": "claimedAt", "type": "i64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "Unauthorized", "msg": "Unauthorized: Only property authority can perform this action" },
    { "code": 6001, "name": "PropertyNameTooLong", "msg": "Property name too long (max 50 characters)" },
    { "code": 6002, "name": "PropertySymbolTooLong", "msg": "Property symbol too long (max 10 characters)" },
    { "code": 6003, "name": "InvalidTotalSupply", "msg": "Invalid total supply: must be greater than zero" },
    { "code": 6004, "name": "ExceedsMaxSupply", "msg": "Exceeds maximum supply: cannot mint more tokens than total supply" },
    { "code": 6005, "name": "PropertyNotActive", "msg": "Property is not active: minting is disabled" },
    { "code": 6006, "name": "InvalidMint", "msg": "Invalid mint account" },
    { "code": 6007, "name": "KycVerificationRequired", "msg": "KYC verification required: SAS attestation not found or invalid" },
    { "code": 6008, "name": "InvalidRentalYield", "msg": "Invalid rental yield: must be between 0 and 10000 basis points (0-100%)" },
    { "code": 6009, "name": "SasAttestationExpired", "msg": "SAS attestation expired" },
    { "code": 6010, "name": "SasAttestationNotVerified", "msg": "SAS attestation not verified" },
    { "code": 6011, "name": "InvalidSasProgram", "msg": "Invalid SAS program" },
    { "code": 6012, "name": "PropertyAddressTooLong", "msg": "Property address too long" },
    { "code": 6013, "name": "PropertyTypeTooLong", "msg": "Property type too long" },
    { "code": 6014, "name": "MetadataUriTooLong", "msg": "Metadata URI too long" },
    { "code": 6015, "name": "InsufficientBalance", "msg": "Insufficient token balance for burn operation" },
    { "code": 6016, "name": "InvalidAmount", "msg": "Invalid amount: must be greater than zero" },
    { "code": 6017, "name": "NoTokenHolders", "msg": "No token holders: cannot distribute revenue" },
    { "code": 6018, "name": "MathOverflow", "msg": "Math overflow in calculation" },
    { "code": 6019, "name": "ClaimTooSmall", "msg": "Claim amount too small" },
    { "code": 6020, "name": "InsufficientVaultBalance", "msg": "Insufficient vault balance" },
    { "code": 6021, "name": "InvalidEpoch", "msg": "Invalid epoch for this property" },
    { "code": 6022, "name": "EpochNotFinalized", "msg": "Epoch not finalized: cannot claim yet" }
  ],
};

// Salva o IDL
fs.writeFileSync('target/idl/hub_token_program.json', JSON.stringify(idl, null, 2));
console.log('✅ IDL gerado com sucesso para Anchor 0.32!');
