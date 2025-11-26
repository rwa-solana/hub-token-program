/**
 * Script para validar que o IDL manual está 100% correto
 *
 * Verifica:
 * - Todas instruções do código estão no IDL
 * - Todos parâmetros corretos
 * - Todos tipos definidos
 * - Todos eventos presentes
 * - Todos erros documentados
 */

import * as fs from 'fs';
import * as path from 'path';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color: string, message: string) {
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

// ============================================================================
// 1. VALIDAR INSTRUÇÕES
// ============================================================================
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
  const instruction = idl.instructions.find((i: any) => i.name === expected.name);

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

const instructionCount = idl.instructions.length;
log(colors.blue, `\n  Total de instruções no IDL: ${instructionCount}`);
if (instructionCount === expectedInstructions.length) {
  log(colors.green, `  ✓ Todas ${expectedInstructions.length} instruções presentes`);
} else {
  log(
    colors.red,
    `  ❌ Esperado ${expectedInstructions.length} instruções, encontrado ${instructionCount}`
  );
  errors++;
}

// ============================================================================
// 2. VALIDAR TIPOS
// ============================================================================
log(colors.blue, '\n2️⃣  VALIDANDO TIPOS\n');

const expectedTypes = [
  {
    name: 'PropertyDetails',
    fields: ['propertyAddress', 'propertyType', 'totalValueUsd', 'rentalYieldBps', 'metadataUri'],
  },
];

// Validar PropertyState em accounts
const propertyStateAccount = idl.accounts.find((a: any) => a.name === 'PropertyState');
if (!propertyStateAccount) {
  log(colors.red, '  ❌ PropertyState ausente em accounts');
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

  const fields = propertyStateAccount.type.fields.map((f: any) => f.name);
  expectedFields.forEach((field) => {
    if (!fields.includes(field)) {
      log(colors.red, `    ❌ Campo ausente: ${field}`);
      errors++;
    }
  });

  if (fields.length === expectedFields.length) {
    log(colors.green, `    ✓ Todos ${expectedFields.length} campos presentes`);
  }
}

// Validar PropertyDetails em types
expectedTypes.forEach((expected) => {
  const type = idl.types.find((t: any) => t.name === expected.name);

  if (!type) {
    log(colors.red, `  ❌ Tipo ausente: ${expected.name}`);
    errors++;
    return;
  }

  log(colors.green, `  ✓ ${expected.name} (type)`);

  const fields = type.type.fields.map((f: any) => f.name);
  expected.fields.forEach((field) => {
    if (!fields.includes(field)) {
      log(colors.red, `    ❌ Campo ausente: ${field}`);
      errors++;
    }
  });

  if (fields.length === expected.fields.length) {
    log(colors.green, `    ✓ Todos ${expected.fields.length} campos presentes`);
  }
});

// ============================================================================
// 3. VALIDAR EVENTOS
// ============================================================================
log(colors.blue, '\n3️⃣  VALIDANDO EVENTOS\n');

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
  const event = idl.events.find((e: any) => e.name === eventName);

  if (!event) {
    log(colors.red, `  ❌ Evento ausente: ${eventName}`);
    errors++;
  } else {
    log(colors.green, `  ✓ ${eventName}`);
  }
});

const eventCount = idl.events.length;
log(colors.blue, `\n  Total de eventos no IDL: ${eventCount}`);
if (eventCount === expectedEvents.length) {
  log(colors.green, `  ✓ Todos ${expectedEvents.length} eventos presentes`);
} else {
  log(colors.red, `  ❌ Esperado ${expectedEvents.length} eventos, encontrado ${eventCount}`);
  errors++;
}

// ============================================================================
// 4. VALIDAR ERROS
// ============================================================================
log(colors.blue, '\n4️⃣  VALIDANDO ERROS\n');

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
  const error = idl.errors.find((e: any) => e.code === expected.code && e.name === expected.name);

  if (!error) {
    log(colors.red, `  ❌ Erro ausente: ${expected.code} - ${expected.name}`);
    errors++;
  } else {
    log(colors.green, `  ✓ ${expected.code}: ${expected.name}`);
    if (!error.msg) {
      log(colors.yellow, `    ⚠️  Mensagem de erro ausente`);
      warnings++;
    }
  }
});

const errorCount = idl.errors.length;
log(colors.blue, `\n  Total de erros no IDL: ${errorCount}`);
if (errorCount === expectedErrors.length) {
  log(colors.green, `  ✓ Todos ${expectedErrors.length} erros presentes`);
} else {
  log(colors.yellow, `  ⚠️  Esperado ${expectedErrors.length} erros, encontrado ${errorCount}`);
  warnings++;
}

// ============================================================================
// 5. VALIDAR METADADOS
// ============================================================================
log(colors.blue, '\n5️⃣  VALIDANDO METADADOS\n');

if (idl.version) {
  log(colors.green, `  ✓ Versão: ${idl.version}`);
} else {
  log(colors.yellow, `  ⚠️  Versão não definida`);
  warnings++;
}

if (idl.name) {
  log(colors.green, `  ✓ Nome: ${idl.name}`);
} else {
  log(colors.red, `  ❌ Nome não definido`);
  errors++;
}

if (idl.metadata?.address) {
  log(colors.green, `  ✓ Program ID: ${idl.metadata.address}`);
} else {
  log(colors.yellow, `  ⚠️  Program ID não definido em metadata`);
  warnings++;
}

// ============================================================================
// 6. VALIDAR ESTRUTURA DAS INSTRUÇÕES
// ============================================================================
log(colors.blue, '\n6️⃣  VALIDANDO ESTRUTURA DAS INSTRUÇÕES\n');

idl.instructions.forEach((instruction: any) => {
  let instructionOk = true;

  // Verificar accounts
  instruction.accounts.forEach((account: any) => {
    if (!account.name) {
      log(colors.red, `  ❌ ${instruction.name}: conta sem nome`);
      errors++;
      instructionOk = false;
    }
    if (account.isMut === undefined) {
      log(colors.yellow, `  ⚠️  ${instruction.name}: conta '${account.name}' sem isMut`);
      warnings++;
      instructionOk = false;
    }
    if (account.isSigner === undefined) {
      log(colors.yellow, `  ⚠️  ${instruction.name}: conta '${account.name}' sem isSigner`);
      warnings++;
      instructionOk = false;
    }
  });

  // Verificar args
  instruction.args.forEach((arg: any) => {
    if (!arg.name) {
      log(colors.red, `  ❌ ${instruction.name}: argumento sem nome`);
      errors++;
      instructionOk = false;
    }
    if (!arg.type) {
      log(colors.red, `  ❌ ${instruction.name}: argumento '${arg.name}' sem tipo`);
      errors++;
      instructionOk = false;
    }
  });

  if (instructionOk) {
    log(colors.green, `  ✓ ${instruction.name}: estrutura válida`);
  }
});

// ============================================================================
// RESULTADO FINAL
// ============================================================================
console.log('\n' + '='.repeat(70));
log(colors.blue, '📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(70) + '\n');

log(colors.blue, `  Instruções: ${idl.instructions.length}/${expectedInstructions.length}`);
log(colors.blue, `  Eventos: ${idl.events.length}/${expectedEvents.length}`);
log(colors.blue, `  Erros: ${idl.errors.length}/${expectedErrors.length}`);
log(colors.blue, `  Tipos: ${idl.types.length + idl.accounts.length}/${expectedTypes.length + 1}`);

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
  process.exit(0);
}
