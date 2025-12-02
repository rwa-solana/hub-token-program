package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

func New(url string) (*DB, error) {
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{db}, nil
}

func (db *DB) Initialize() error {
	schema := `
	CREATE TABLE IF NOT EXISTS properties (
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
		image TEXT,
		current_epoch BIGINT NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
		last_indexed_slot BIGINT NOT NULL DEFAULT 0
	);

	CREATE INDEX IF NOT EXISTS idx_properties_mint ON properties(mint);
	CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
	CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
	CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at);

	-- Add image column if it doesn't exist (for existing databases)
	DO $$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='image') THEN
			ALTER TABLE properties ADD COLUMN image TEXT;
		END IF;
	END $$;
	`

	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	return nil
}
