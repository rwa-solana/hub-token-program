package config

import (
	"os"
	"time"
)

type Config struct {
	Solana   SolanaConfig
	Database DatabaseConfig
	Server   ServerConfig
	Indexer  IndexerConfig
}

type SolanaConfig struct {
	RPCURL    string
	ProgramID string
}

type DatabaseConfig struct {
	URL string
}

type ServerConfig struct {
	Port string
	Host string
}

type IndexerConfig struct {
	Interval time.Duration
	Enabled  bool
}

func Load() (*Config, error) {
	interval, err := time.ParseDuration(getEnv("INDEXER_INTERVAL", "60s"))
	if err != nil {
		interval = 60 * time.Second
	}

	return &Config{
		Solana: SolanaConfig{
			RPCURL:    getEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
			ProgramID: getEnv("SOLANA_PROGRAM_ID", ""),
		},
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/hub_indexer?sslmode=disable"),
		},
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Host: getEnv("HOST", "0.0.0.0"),
		},
		Indexer: IndexerConfig{
			Interval: interval,
			Enabled:  getEnv("INDEXER_ENABLED", "true") == "true",
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
