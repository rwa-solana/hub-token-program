package models

import (
	"time"
)

type Property struct {
	ID                int64     `json:"id" db:"id"`
	Mint              string    `json:"mint" db:"mint"`
	PropertyStatePDA  string    `json:"propertyStatePda" db:"property_state_pda"`
	Name              string    `json:"name" db:"name"`
	Symbol            string    `json:"symbol" db:"symbol"`
	Authority         string    `json:"authority" db:"authority"`
	Status            string    `json:"status" db:"status"`
	TotalSupply       int64     `json:"totalSupply" db:"total_supply"`
	CirculatingSupply int64     `json:"circulatingSupply" db:"circulating_supply"`
	Decimals          int       `json:"decimals" db:"decimals"`
	PropertyType      string    `json:"propertyType" db:"property_type"`
	Location          string    `json:"location" db:"location"`
	TotalValueUsd     int64     `json:"totalValueUsd" db:"total_value_usd"`
	AnnualYield       int64     `json:"annualYield" db:"annual_yield"`
	MetadataURI       string    `json:"metadataUri" db:"metadata_uri"`
	Image             string    `json:"image" db:"image"`
	CurrentEpoch      int64     `json:"currentEpoch" db:"current_epoch"`
	CreatedAt         time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time `json:"updatedAt" db:"updated_at"`
	LastIndexedSlot   int64     `json:"lastIndexedSlot" db:"last_indexed_slot"`
}

type PropertyState struct {
	Mint              [32]byte
	Authority         [32]byte
	Discriminator     uint64
	Name              string
	Symbol            string
	TotalValueUsd     uint64
	CirculatingSupply uint64
	Location          string
	PropertyType      string
	AnnualYield       uint32
	MetadataURI       string
	TotalSupply       uint64
	AvailableSupply   uint64
	Decimals          uint8
}

type PropertyFilter struct {
	Status       string
	MinValue     *int64
	MaxValue     *int64
	PropertyType string
}
