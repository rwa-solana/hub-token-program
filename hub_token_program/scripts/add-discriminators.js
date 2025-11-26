const fs = require('fs');
const crypto = require('crypto');

// Lê o IDL
const idlPath = 'target/idl/hub_token_program.json';
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Função para calcular discriminator (primeiros 8 bytes do SHA256)
function calculateDiscriminator(namespace, name) {
  const preimage = `${namespace}:${name}`;
  const hash = crypto.createHash('sha256').update(preimage).digest();
  return Array.from(hash.slice(0, 8));
}

// Adiciona discriminators às instruções
idl.instructions = idl.instructions.map(ix => ({
  ...ix,
  discriminator: calculateDiscriminator('global', ix.name)
}));

// Adiciona discriminators às accounts
idl.accounts = idl.accounts.map(acc => ({
  ...acc,
  discriminator: calculateDiscriminator('account', acc.name)
}));

// Adiciona discriminators aos events
idl.events = idl.events.map(event => ({
  ...event,
  discriminator: calculateDiscriminator('event', event.name)
}));

// Salva o IDL atualizado
fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
console.log('✅ Discriminators adicionados com sucesso!');
