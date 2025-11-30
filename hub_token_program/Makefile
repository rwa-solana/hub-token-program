.PHONY: help build up down logs shell test deploy clean

# Colors
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help
	@echo "Hub Token - Docker Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Docker Commands
build: ## Build Docker images
	docker compose build

up: ## Start production API
	docker compose up -d api
	@echo "$(GREEN)API running at http://localhost:3002$(NC)"

up-dev: ## Start development API with hot reload
	docker compose --profile dev up -d api-dev
	@echo "$(GREEN)Dev API running at http://localhost:3002$(NC)"

down: ## Stop all containers
	docker compose down

logs: ## View API logs
	docker compose logs -f api

logs-dev: ## View dev API logs
	docker compose logs -f api-dev

shell: ## Open shell in API container
	docker compose exec api sh

restart: ## Restart API
	docker compose restart api

clean: ## Remove containers and images
	docker compose down -v --rmi local

# Anchor Commands
anchor-build: ## Build Anchor program
	anchor build

anchor-test: ## Run Anchor tests
	anchor test

anchor-deploy-devnet: ## Deploy to devnet
	anchor deploy --provider.cluster devnet

# Solana Validator Commands
validator-start: ## Start local Solana test validator
	@echo "$(GREEN)Starting Solana test validator...$(NC)"
	@export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$PATH" && solana-test-validator

validator-stop: ## Stop local Solana test validator
	@pkill -f solana-test-validator || echo "Validator not running"
	@echo "$(GREEN)Validator stopped$(NC)"

validator-logs: ## Show validator logs
	@tail -f test-ledger/validator.log

validator-clean: ## Clean validator ledger
	@rm -rf test-ledger .anchor/test-ledger
	@echo "$(GREEN)Validator ledger cleaned$(NC)"

localhost: ## Configure Solana CLI to use localhost
	@solana config set --url localhost
	@echo "$(GREEN)Configured to use localhost$(NC)"

devnet: ## Configure Solana CLI to use devnet
	@solana config set --url devnet
	@echo "$(GREEN)Configured to use devnet$(NC)"

airdrop: ## Request SOL airdrop (localhost only)
	@solana airdrop 10
	@echo "$(GREEN)Airdrop requested$(NC)"

# Full Stack Commands
dev: up-dev ## Start full development environment
	@echo "$(GREEN)Development environment started$(NC)"
	@echo "API: http://localhost:3002"
	@echo "Frontend: cd app && yarn dev"

status: ## Show container status
	docker compose ps

health: ## Check API health
	@curl -s http://localhost:3002/api/v1/health | python3 -m json.tool || echo "API not responding"
