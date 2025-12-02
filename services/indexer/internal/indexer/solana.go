package indexer

import (
	"context"
	"encoding/binary"
	"fmt"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
	"github.com/hub-token/indexer/internal/models"
)

type SolanaClient struct {
	client    *rpc.Client
	programID solana.PublicKey
}

func NewSolanaClient(rpcURL string, programID string) (*SolanaClient, error) {
	client := rpc.New(rpcURL)

	pubkey, err := solana.PublicKeyFromBase58(programID)
	if err != nil {
		return nil, fmt.Errorf("invalid program ID: %w", err)
	}

	return &SolanaClient{
		client:    client,
		programID: pubkey,
	}, nil
}

func (s *SolanaClient) FetchAllProperties(ctx context.Context) ([]models.Property, error) {
	// Filter for PropertyState accounts (exactly 996 bytes)
	opts := &rpc.GetProgramAccountsOpts{
		Commitment: rpc.CommitmentConfirmed,
		Filters: []rpc.RPCFilter{
			{
				DataSize: 996,
			},
		},
	}

	accounts, err := s.client.GetProgramAccountsWithOpts(ctx, s.programID, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch program accounts: %w", err)
	}

	properties := make([]models.Property, 0, len(accounts))

	for _, acc := range accounts {
		property, err := s.parsePropertyState(acc.Pubkey, acc.Account.Data.GetBinary())
		if err != nil {
			fmt.Printf("Warning: failed to parse property %s: %v\n", acc.Pubkey.String(), err)
			continue
		}

		properties = append(properties, property)
	}

	return properties, nil
}

func (s *SolanaClient) FetchPropertyByPDA(ctx context.Context, pda string) (*models.Property, error) {
	pubkey, err := solana.PublicKeyFromBase58(pda)
	if err != nil {
		return nil, fmt.Errorf("invalid PDA: %w", err)
	}

	acc, err := s.client.GetAccountInfo(ctx, pubkey)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch account: %w", err)
	}

	if acc == nil || acc.Value == nil {
		return nil, fmt.Errorf("account not found")
	}

	property, err := s.parsePropertyState(pubkey, acc.Value.Data.GetBinary())
	if err != nil {
		return nil, fmt.Errorf("failed to parse property state: %w", err)
	}

	return &property, nil
}

func (s *SolanaClient) parsePropertyState(pubkey solana.PublicKey, data []byte) (models.Property, error) {
	if len(data) < 996 {
		return models.Property{}, fmt.Errorf("invalid data size: %d", len(data))
	}

	offset := 0

	// Discriminator (8 bytes) - Anchor account discriminator
	offset += 8

	// Authority (Pubkey - 32 bytes)
	authority := solana.PublicKeyFromBytes(data[offset : offset+32])
	offset += 32

	// Mint (Pubkey - 32 bytes)
	mint := solana.PublicKeyFromBytes(data[offset : offset+32])
	offset += 32

	// property_name (String - 4 byte length prefix + data)
	nameLen := binary.LittleEndian.Uint32(data[offset : offset+4])
	offset += 4
	if offset+int(nameLen) > len(data) {
		return models.Property{}, fmt.Errorf("name length exceeds data bounds")
	}
	name := string(data[offset : offset+int(nameLen)])
	offset += int(nameLen)

	// property_symbol (String - 4 byte length prefix + data)
	symbolLen := binary.LittleEndian.Uint32(data[offset : offset+4])
	offset += 4
	if offset+int(symbolLen) > len(data) {
		return models.Property{}, fmt.Errorf("symbol length exceeds data bounds")
	}
	symbol := string(data[offset : offset+int(symbolLen)])
	offset += int(symbolLen)

	// total_supply (u64 - 8 bytes)
	totalSupply := binary.LittleEndian.Uint64(data[offset : offset+8])
	offset += 8

	// circulating_supply (u64 - 8 bytes)
	circulatingSupply := binary.LittleEndian.Uint64(data[offset : offset+8])
	offset += 8

	// details struct:
	// - property_address (String)
	addressLen := binary.LittleEndian.Uint32(data[offset : offset+4])
	offset += 4
	if offset+int(addressLen) > len(data) {
		return models.Property{}, fmt.Errorf("property address length exceeds data bounds")
	}
	location := string(data[offset : offset+int(addressLen)])
	offset += int(addressLen)

	// - property_type (String)
	typeLen := binary.LittleEndian.Uint32(data[offset : offset+4])
	offset += 4
	if offset+int(typeLen) > len(data) {
		return models.Property{}, fmt.Errorf("property type length exceeds data bounds")
	}
	propertyType := string(data[offset : offset+int(typeLen)])
	offset += int(typeLen)

	// - total_value_usd (u64 - 8 bytes)
	totalValueUsd := binary.LittleEndian.Uint64(data[offset : offset+8])
	offset += 8

	// - rental_yield_bps (u16 - 2 bytes)
	rentalYieldBps := binary.LittleEndian.Uint16(data[offset : offset+2])
	offset += 2

	// - metadata_uri (String)
	uriLen := binary.LittleEndian.Uint32(data[offset : offset+4])
	offset += 4
	if offset+int(uriLen) > len(data) {
		return models.Property{}, fmt.Errorf("metadata URI length exceeds data bounds")
	}
	metadataURI := string(data[offset : offset+int(uriLen)])
	offset += int(uriLen)

	// is_active (bool - 1 byte)
	isActive := data[offset] == 1
	offset += 1

	// created_at (i64 - 8 bytes) - skip
	offset += 8

	// updated_at (i64 - 8 bytes) - skip
	offset += 8

	// bump (u8 - 1 byte) - skip
	// offset += 1

	status := "paused"
	if isActive {
		status = "active"
	}

	return models.Property{
		Mint:              mint.String(),
		PropertyStatePDA:  pubkey.String(),
		Name:              name,
		Symbol:            symbol,
		Authority:         authority.String(),
		Status:            status,
		TotalSupply:       int64(totalSupply),
		CirculatingSupply: int64(circulatingSupply),
		Decimals:          6, // Default to 6, would need to fetch from mint
		PropertyType:      propertyType,
		Location:          location,
		TotalValueUsd:     int64(totalValueUsd),
		AnnualYield:       int64(rentalYieldBps),
		MetadataURI:       metadataURI,
		CurrentEpoch:      0,
	}, nil
}

func (s *SolanaClient) DerivePropertyStatePDA(mint string) (string, error) {
	mintPubkey, err := solana.PublicKeyFromBase58(mint)
	if err != nil {
		return "", fmt.Errorf("invalid mint: %w", err)
	}

	seeds := [][]byte{
		[]byte("property"),
		mintPubkey[:],
	}

	pda, _, err := solana.FindProgramAddress(seeds, s.programID)
	if err != nil {
		return "", fmt.Errorf("failed to derive PDA: %w", err)
	}

	return pda.String(), nil
}
