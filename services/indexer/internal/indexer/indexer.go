package indexer

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/hub-token/indexer/internal/database"
	"github.com/hub-token/indexer/internal/models"
)

// IPFSMetadata represents the structure of IPFS metadata JSON
type IPFSMetadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
}

type Indexer struct {
	db            *database.DB
	solanaClient  *SolanaClient
	interval      time.Duration
	stopChan      chan struct{}
	isRunning     bool
	httpClient    *http.Client
	ipfsGateway   string
}

func New(db *database.DB, solanaClient *SolanaClient, interval time.Duration) *Indexer {
	return &Indexer{
		db:           db,
		solanaClient: solanaClient,
		interval:     interval,
		stopChan:     make(chan struct{}),
		isRunning:    false,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		ipfsGateway: "https://gateway.pinata.cloud/ipfs/",
	}
}

func (idx *Indexer) Start() {
	if idx.isRunning {
		log.Println("Indexer is already running")
		return
	}

	idx.isRunning = true
	log.Println("Starting indexer...")

	// Run immediately on start
	go func() {
		if err := idx.IndexProperties(context.Background()); err != nil {
			log.Printf("Error during initial indexing: %v\n", err)
		}
	}()

	// Then run on interval
	ticker := time.NewTicker(idx.interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				if err := idx.IndexProperties(context.Background()); err != nil {
					log.Printf("Error during periodic indexing: %v\n", err)
				}
			case <-idx.stopChan:
				ticker.Stop()
				return
			}
		}
	}()
}

func (idx *Indexer) Stop() {
	if !idx.isRunning {
		return
	}
	log.Println("Stopping indexer...")
	close(idx.stopChan)
	idx.isRunning = false
}

func (idx *Indexer) IndexProperties(ctx context.Context) error {
	log.Println("Fetching properties from Solana...")

	properties, err := idx.solanaClient.FetchAllProperties(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch properties: %w", err)
	}

	log.Printf("Found %d properties, updating database...\n", len(properties))

	for i := range properties {
		// Fetch image from IPFS metadata if available
		if properties[i].MetadataURI != "" {
			image, err := idx.fetchImageFromIPFS(properties[i].MetadataURI)
			if err != nil {
				log.Printf("Warning: failed to fetch IPFS metadata for %s: %v\n", properties[i].Mint, err)
			} else {
				properties[i].Image = image
			}
		}

		if err := idx.upsertProperty(properties[i]); err != nil {
			log.Printf("Error upserting property %s: %v\n", properties[i].Mint, err)
			continue
		}
	}

	log.Printf("Successfully indexed %d properties\n", len(properties))
	return nil
}

// fetchImageFromIPFS fetches metadata from IPFS and extracts the image URL
func (idx *Indexer) fetchImageFromIPFS(metadataURI string) (string, error) {
	// Convert ipfs:// to gateway URL
	url := metadataURI
	if strings.HasPrefix(metadataURI, "ipfs://") {
		cid := strings.TrimPrefix(metadataURI, "ipfs://")
		url = idx.ipfsGateway + cid
	}

	resp, err := idx.httpClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch metadata: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("metadata fetch returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	var metadata IPFSMetadata
	if err := json.Unmarshal(body, &metadata); err != nil {
		return "", fmt.Errorf("failed to parse metadata JSON: %w", err)
	}

	// Convert ipfs:// image URL to gateway URL
	image := metadata.Image
	if strings.HasPrefix(image, "ipfs://") {
		cid := strings.TrimPrefix(image, "ipfs://")
		image = idx.ipfsGateway + cid
	}

	return image, nil
}

func (idx *Indexer) upsertProperty(property models.Property) error {
	query := `
		INSERT INTO properties (
			mint, property_state_pda, name, symbol, authority, status,
			total_supply, circulating_supply, decimals, property_type,
			location, total_value_usd, annual_yield, metadata_uri, image,
			current_epoch, created_at, updated_at, last_indexed_slot
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), $17)
		ON CONFLICT (mint) DO UPDATE SET
			property_state_pda = EXCLUDED.property_state_pda,
			name = EXCLUDED.name,
			symbol = EXCLUDED.symbol,
			authority = EXCLUDED.authority,
			status = EXCLUDED.status,
			total_supply = EXCLUDED.total_supply,
			circulating_supply = EXCLUDED.circulating_supply,
			decimals = EXCLUDED.decimals,
			property_type = EXCLUDED.property_type,
			location = EXCLUDED.location,
			total_value_usd = EXCLUDED.total_value_usd,
			annual_yield = EXCLUDED.annual_yield,
			metadata_uri = EXCLUDED.metadata_uri,
			image = EXCLUDED.image,
			current_epoch = EXCLUDED.current_epoch,
			updated_at = NOW(),
			last_indexed_slot = EXCLUDED.last_indexed_slot
	`

	_, err := idx.db.Exec(query,
		property.Mint,
		property.PropertyStatePDA,
		property.Name,
		property.Symbol,
		property.Authority,
		property.Status,
		property.TotalSupply,
		property.CirculatingSupply,
		property.Decimals,
		property.PropertyType,
		property.Location,
		property.TotalValueUsd,
		property.AnnualYield,
		property.MetadataURI,
		property.Image,
		property.CurrentEpoch,
		property.LastIndexedSlot,
	)

	if err != nil {
		return fmt.Errorf("failed to upsert property: %w", err)
	}

	return nil
}

func (idx *Indexer) GetAllProperties(filter *models.PropertyFilter) ([]models.Property, error) {
	query := `SELECT id, mint, property_state_pda, name, symbol, authority, status,
		total_supply, circulating_supply, decimals, property_type, location,
		total_value_usd, annual_yield, metadata_uri, image, current_epoch,
		created_at, updated_at, last_indexed_slot FROM properties WHERE 1=1`
	args := []interface{}{}
	argCount := 1

	if filter != nil {
		if filter.Status != "" {
			query += fmt.Sprintf(" AND status = $%d", argCount)
			args = append(args, filter.Status)
			argCount++
		}
		if filter.MinValue != nil {
			query += fmt.Sprintf(" AND total_value_usd >= $%d", argCount)
			args = append(args, *filter.MinValue)
			argCount++
		}
		if filter.MaxValue != nil {
			query += fmt.Sprintf(" AND total_value_usd <= $%d", argCount)
			args = append(args, *filter.MaxValue)
			argCount++
		}
		if filter.PropertyType != "" {
			query += fmt.Sprintf(" AND property_type = $%d", argCount)
			args = append(args, filter.PropertyType)
			argCount++
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := idx.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query properties: %w", err)
	}
	defer rows.Close()

	properties := []models.Property{}
	for rows.Next() {
		var prop models.Property
		var image sql.NullString
		err := rows.Scan(
			&prop.ID,
			&prop.Mint,
			&prop.PropertyStatePDA,
			&prop.Name,
			&prop.Symbol,
			&prop.Authority,
			&prop.Status,
			&prop.TotalSupply,
			&prop.CirculatingSupply,
			&prop.Decimals,
			&prop.PropertyType,
			&prop.Location,
			&prop.TotalValueUsd,
			&prop.AnnualYield,
			&prop.MetadataURI,
			&image,
			&prop.CurrentEpoch,
			&prop.CreatedAt,
			&prop.UpdatedAt,
			&prop.LastIndexedSlot,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan property: %w", err)
		}
		if image.Valid {
			prop.Image = image.String
		}
		properties = append(properties, prop)
	}

	return properties, nil
}

func (idx *Indexer) GetPropertyByMint(mint string) (*models.Property, error) {
	query := `SELECT id, mint, property_state_pda, name, symbol, authority, status,
		total_supply, circulating_supply, decimals, property_type, location,
		total_value_usd, annual_yield, metadata_uri, image, current_epoch,
		created_at, updated_at, last_indexed_slot FROM properties WHERE mint = $1`

	var prop models.Property
	var image sql.NullString
	err := idx.db.QueryRow(query, mint).Scan(
		&prop.ID,
		&prop.Mint,
		&prop.PropertyStatePDA,
		&prop.Name,
		&prop.Symbol,
		&prop.Authority,
		&prop.Status,
		&prop.TotalSupply,
		&prop.CirculatingSupply,
		&prop.Decimals,
		&prop.PropertyType,
		&prop.Location,
		&prop.TotalValueUsd,
		&prop.AnnualYield,
		&prop.MetadataURI,
		&image,
		&prop.CurrentEpoch,
		&prop.CreatedAt,
		&prop.UpdatedAt,
		&prop.LastIndexedSlot,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get property: %w", err)
	}

	if image.Valid {
		prop.Image = image.String
	}

	return &prop, nil
}
