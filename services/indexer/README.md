# Hub Token Indexer

A high-performance indexer service written in Go for indexing Solana Hub Token Program properties.

## Features

- 🚀 **Fast indexing** - Efficiently fetches and stores property data from Solana blockchain
- 🔄 **Auto-sync** - Periodic synchronization with configurable intervals
- 📊 **REST API** - Query indexed properties via HTTP endpoints
- 🐘 **PostgreSQL** - Reliable data storage with proper indexing
- 🐳 **Docker ready** - Easy deployment with Docker and Docker Compose

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Solana    │────────>│   Indexer    │────────>│ PostgreSQL │
│  Devnet/    │         │   Service    │         │  Database  │
│  Mainnet    │         └──────────────┘         └────────────┘
└─────────────┘                │
                               │
                               ▼
                         ┌──────────┐
                         │ REST API │
                         └──────────┘
```

## Installation

### Prerequisites

- Go 1.21+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Setup

1. Clone the repository and navigate to the indexer directory

2. Install dependencies:
```bash
make deps
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with appropriate values

5. Run the application:
```bash
make run
```

## Configuration

Environment variables:

- `SOLANA_RPC_URL` - Solana RPC endpoint (default: https://api.devnet.solana.com)
- `SOLANA_PROGRAM_ID` - Hub Token Program ID
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - HTTP server port (default: 8080)
- `INDEXER_INTERVAL` - Indexing interval (default: 60s)
- `INDEXER_ENABLED` - Enable/disable auto-indexing (default: true)

## API Endpoints

### Health Check
```
GET /health
```

### Get All Properties
```
GET /api/v1/properties
```

Query parameters:
- `status` - Filter by status (active, paused)
- `minValue` - Minimum property value
- `maxValue` - Maximum property value
- `propertyType` - Filter by property type

### Get Property by Mint
```
GET /api/v1/properties/:mint
```

### Trigger Manual Indexing
```
POST /api/v1/index/trigger
```

## Development

### Build
```bash
make build
```

### Run tests
```bash
make test
```

### Format code
```bash
make fmt
```

## Docker

### Build image
```bash
make docker-build
```

### Run with Docker Compose
```bash
docker-compose up indexer
```

## Database Schema

The indexer creates the following table:

```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    property_state_pda VARCHAR(44) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    authority VARCHAR(44) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    total_supply BIGINT NOT NULL DEFAULT 0,
    circulating_supply BIGINT NOT NULL DEFAULT 0,
    decimals INTEGER NOT NULL DEFAULT 0,
    property_type VARCHAR(50),
    location VARCHAR(255),
    total_value_usd BIGINT NOT NULL DEFAULT 0,
    annual_yield BIGINT NOT NULL DEFAULT 0,
    metadata_uri TEXT,
    current_epoch BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_indexed_slot BIGINT NOT NULL DEFAULT 0
);
```

## License

MIT
