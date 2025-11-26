#!/bin/bash

# Script para testar com fork da mainnet Solana
# Similar ao forge test --fork-url no Ethereum

set -e

echo "🔄 Iniciando solana-test-validator com fork da mainnet..."

# Matar qualquer validador rodando
pkill -9 solana-test-validator 2>/dev/null || true

# Configurar PATH para usar Agave
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Iniciar validator clonando programas importantes da mainnet
solana-test-validator \
  --url https://api.mainnet-beta.solana.com \
  --clone TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
  --reset \
  --quiet &

VALIDATOR_PID=$!

echo "✅ Validator iniciado (PID: $VALIDATOR_PID)"
echo "🌐 Clonado Token-2022 da mainnet"
echo "⏳ Aguardando validator ficar pronto..."

# Aguardar validator ficar pronto
sleep 5

# Verificar se está rodando
if solana cluster-version 2>/dev/null; then
  echo "✅ Validator pronto!"
  echo ""
  echo "📝 Agora você pode rodar seus testes:"
  echo "   anchor test --skip-build --skip-local-validator"
  echo ""
  echo "🛑 Para parar o validator:"
  echo "   kill $VALIDATOR_PID"
else
  echo "❌ Erro ao iniciar validator"
  kill $VALIDATOR_PID 2>/dev/null || true
  exit 1
fi

# Manter script rodando
wait $VALIDATOR_PID
