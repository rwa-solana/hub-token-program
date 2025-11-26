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
  "address": "CA7Z9VgsUuDWZreqaUfJztBgEgi6ksW9iyW9pjvMarKU",
  "metadata": {
    "name": "hub_token_program",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeProperty",
      "discriminator": calculateDiscriminator('global', 'initialize_property'),
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "mint", "writable": true },
        { "name": "propertyState", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [112, 114, 111, 112, 101, 114, 116, 121] }, { "kind": "account", "path": "mint" }] } },
        { "name": "tokenProgram", "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "decimals", "type": "u8" },
        { "name": "propertyName", "type": "string" },
        { "name": "propertySymbol", "type": "string" },
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
    }
  ],
  "accounts": [
    {
      "name": "PropertyState",
      "discriminator": calculateDiscriminator('account', 'PropertyState')
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
    { "code": 6015, "name": "InsufficientBalance", "msg": "Insufficient token balance for burn operation" }
  ],
};

// Salva o IDL
fs.writeFileSync('target/idl/hub_token_program.json', JSON.stringify(idl, null, 2));
console.log('✅ IDL gerado com sucesso para Anchor 0.32!');
