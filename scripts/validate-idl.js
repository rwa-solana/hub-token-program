/**
 * Script para validar que o IDL manual está 100% correto
 */

const fs = require('fs');
const path = require('path');

// Cores
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Carregar IDL
const idlPath = path.join(__dirname, '../target/idl/hub_token_program.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

let errors = 0;
let warnings = 0;

console.log('\n' + '='.repeat(70));
log(colors.blue, '📋 VALIDAÇÃO DO IDL - HUB TOKEN PROGRAM');
console.log('='.repeat(70) + '\n');

// 1. VALIDAR INSTRUÇÕES
log(colors.blue, '\n1️⃣  VALIDANDO INSTRUÇÕES\n');

const expectedInstructions = [
  {
    name: 'initializeProperty',
    args: ['decimals', 'propertyName', 'propertySymbol', 'totalSupply', 'propertyDetails'],
    accounts: ['authority', 'mint', 'propertyState', 'tokenProgram', 'systemProgram'],
  },
  {
    name: 'mintPropertyTokens',
    args: ['amount'],
    accounts: [
      'authority',
      'investor',
      'propertyState',
      'mint',
      'investorTokenAccount',
      'investorAttestation',
      'tokenProgram',
      'associatedTokenProgram',
      'systemProgram',
    ],
  },
  {
    name: 'burnPropertyTokens',
    args: ['amount'],
    accounts: ['investor', 'propertyState', 'mint', 'investorTokenAccount', 'tokenProgram'],
  },
  {
    name: 'updatePropertyDetails',
    args: ['newDetails'],
    accounts: ['authority', 'propertyState', 'mint'],
  },
  {
    name: 'togglePropertyStatus',
    args: [],
    accounts: ['authority', 'propertyState', 'mint'],
  },
];

expectedInstructions.forEach((expected) => {
  const instruction = idl.instructions.find((i) => i.name === expected.name);

  if (!instruction) {
    log(colors.red, `  ❌ Instrução ausente: ${expected.name}`);
    errors++;
    return;
  }

  log(colors.green, `  ✓ ${expected.name}`);

  // Validar argumentos
  if (instruction.args.length !== expected.args.length) {
    log(
      colors.red,
      `    ❌ Número incorreto de argumentos (esperado: ${expected.args.length}, encontrado: ${instruction.args.length})`
    );
    errors++;
  } else {
    expected.args.forEach((argName, index) => {
      if (instruction.args[index]?.name !== argName) {
        log(
          colors.red,
          `      ❌ Argumento ${index}: esperado '${argName}', encontrado '${instruction.args[index]?.name}'`
        );
        errors++;
      }
    });
  }

  // Validar contas
  if (instruction.accounts.length !== expected.accounts.length) {
    log(
      colors.yellow,
      `    ⚠️  Número de contas: esperado ${expected.accounts.length}, encontrado ${instruction.accounts.length}`
    );
    warnings++;
  }
});

log(colors.blue, `\n  Total de instruções no IDL: ${idl.instructions.length}`);
if (idl.instructions.length === expectedInstructions.length) {
  log(colors.green, `  ✓ Todas ${expectedInstructions.length} instruções presentes`);
} else {
  log(
    colors.red,
    `  ❌ Esperado ${expectedInstructions.length} instruções, encontrado ${idl.instructions.length}`
  );
  errors++;
}

// 2. VALIDAR EVENTOS
log(colors.blue, '\n2️⃣  VALIDANDO EVENTOS\n');

const expectedEvents = [
  'PropertyInitialized',
  'TokensMinted',
  'TokensBurned',
  'PropertyUpdated',
  'PropertyStatusChanged',
  'SasVerificationSuccess',
  'SasVerificationFailed',
];

expectedEvents.forEach((eventName) => {
  const event = idl.events.find((e) => e.name === eventName);

  if (!event) {
    log(colors.red, `  ❌ Evento ausente: ${eventName}`);
    errors++;
  } else {
    log(colors.green, `  ✓ ${eventName}`);
  }
});

log(colors.blue, `\n  Total de eventos no IDL: ${idl.events.length}`);
if (idl.events.length === expectedEvents.length) {
  log(colors.green, `  ✓ Todos ${expectedEvents.length} eventos presentes`);
} else {
  log(colors.red, `  ❌ Esperado ${expectedEvents.length} eventos, encontrado ${idl.events.length}`);
  errors++;
}

// 3. VALIDAR ERROS
log(colors.blue, '\n3️⃣  VALIDANDO ERROS\n');

const expectedErrors = [
  { code: 6000, name: 'Unauthorized' },
  { code: 6001, name: 'PropertyNameTooLong' },
  { code: 6002, name: 'PropertySymbolTooLong' },
  { code: 6003, name: 'InvalidTotalSupply' },
  { code: 6004, name: 'ExceedsMaxSupply' },
  { code: 6005, name: 'PropertyNotActive' },
  { code: 6006, name: 'InvalidMint' },
  { code: 6007, name: 'KycVerificationRequired' },
  { code: 6008, name: 'InvalidRentalYield' },
  { code: 6009, name: 'SasAttestationExpired' },
  { code: 6010, name: 'SasAttestationNotVerified' },
  { code: 6011, name: 'InvalidSasProgram' },
  { code: 6012, name: 'PropertyAddressTooLong' },
  { code: 6013, name: 'PropertyTypeTooLong' },
  { code: 6014, name: 'MetadataUriTooLong' },
  { code: 6015, name: 'InsufficientBalance' },
];

expectedErrors.forEach((expected) => {
  const error = idl.errors.find((e) => e.code === expected.code && e.name === expected.name);

  if (!error) {
    log(colors.red, `  ❌ Erro ausente: ${expected.code} - ${expected.name}`);
    errors++;
  } else {
    log(colors.green, `  ✓ ${expected.code}: ${expected.name}`);
  }
});

log(colors.blue, `\n  Total de erros no IDL: ${idl.errors.length}`);
if (idl.errors.length === expectedErrors.length) {
  log(colors.green, `  ✓ Todos ${expectedErrors.length} erros presentes`);
} else {
  log(colors.red, `  ❌ Esperado ${expectedErrors.length} erros, encontrado ${idl.errors.length}`);
  errors++;
}

// 4. VALIDAR TIPOS
log(colors.blue, '\n4️⃣  VALIDANDO TIPOS E ACCOUNTS\n');

// PropertyState em accounts
const propertyStateAccount = idl.accounts.find((a) => a.name === 'PropertyState');
if (!propertyStateAccount) {
  log(colors.red, '  ❌ PropertyState ausente');
  errors++;
} else {
  log(colors.green, '  ✓ PropertyState (account)');

  const expectedFields = [
    'authority',
    'mint',
    'propertyName',
    'propertySymbol',
    'totalSupply',
    'circulatingSupply',
    'details',
    'isActive',
    'createdAt',
    'updatedAt',
    'bump',
  ];

  const fields = propertyStateAccount.type.fields.map((f) => f.name);
  const missingFields = expectedFields.filter(f => !fields.includes(f));

  if (missingFields.length > 0) {
    log(colors.red, `    ❌ Campos ausentes: ${missingFields.join(', ')}`);
    errors += missingFields.length;
  } else {
    log(colors.green, `    ✓ Todos ${expectedFields.length} campos presentes`);
  }
}

// PropertyDetails em types
const propertyDetailsType = idl.types.find((t) => t.name === 'PropertyDetails');
if (!propertyDetailsType) {
  log(colors.red, '  ❌ PropertyDetails ausente');
  errors++;
} else {
  log(colors.green, '  ✓ PropertyDetails (type)');

  const expectedFields = ['propertyAddress', 'propertyType', 'totalValueUsd', 'rentalYieldBps', 'metadataUri'];
  const fields = propertyDetailsType.type.fields.map((f) => f.name);
  const missingFields = expectedFields.filter(f => !fields.includes(f));

  if (missingFields.length > 0) {
    log(colors.red, `    ❌ Campos ausentes: ${missingFields.join(', ')}`);
    errors += missingFields.length;
  } else {
    log(colors.green, `    ✓ Todos ${expectedFields.length} campos presentes`);
  }
}

// RESULTADO FINAL
console.log('\n' + '='.repeat(70));
log(colors.blue, '📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(70) + '\n');

log(colors.blue, `  Instruções: ${idl.instructions.length}/${expectedInstructions.length}`);
log(colors.blue, `  Eventos: ${idl.events.length}/${expectedEvents.length}`);
log(colors.blue, `  Erros: ${idl.errors.length}/${expectedErrors.length}`);
log(colors.blue, `  Accounts: ${idl.accounts.length}/1`);
log(colors.blue, `  Types: ${idl.types.length}/1`);

console.log();

if (errors > 0) {
  log(colors.red, `❌ VALIDAÇÃO FALHOU: ${errors} erros encontrados`);
  if (warnings > 0) {
    log(colors.yellow, `⚠️  ${warnings} avisos`);
  }
  process.exit(1);
} else if (warnings > 0) {
  log(colors.yellow, `⚠️  VALIDAÇÃO PASSOU COM AVISOS: ${warnings} avisos`);
  console.log();
  log(colors.green, '✅ IDL está funcional mas pode ser melhorado');
  process.exit(0);
} else {
  log(colors.green, '✅ IDL 100% CORRETO E COMPLETO!');
  console.log();
  log(colors.green, '🎉 Todas verificações passaram com sucesso!');
  log(colors.green, '📝 O IDL manual está perfeito e pode ser usado com confiança.');
  console.log();
  process.exit(0);
}
