package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/hub-token/indexer/internal/api"
	"github.com/hub-token/indexer/internal/config"
	"github.com/hub-token/indexer/internal/database"
	"github.com/hub-token/indexer/internal/indexer"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.New(cfg.Database.URL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	if err := db.Initialize(); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	log.Println("Database initialized successfully")

	// Initialize Solana client
	solanaClient, err := indexer.NewSolanaClient(cfg.Solana.RPCURL, cfg.Solana.ProgramID)
	if err != nil {
		log.Fatalf("Failed to initialize Solana client: %v", err)
	}

	log.Printf("Connected to Solana RPC: %s", cfg.Solana.RPCURL)
	log.Printf("Monitoring program: %s", cfg.Solana.ProgramID)

	// Initialize indexer
	idx := indexer.New(db, solanaClient, cfg.Indexer.Interval)

	// Start indexer if enabled
	if cfg.Indexer.Enabled {
		idx.Start()
		log.Printf("Indexer started with interval: %s", cfg.Indexer.Interval)
	} else {
		log.Println("Indexer is disabled")
	}

	// Setup HTTP server
	router := api.SetupRouter(idx)

	// Start server in goroutine
	go func() {
		addr := cfg.Server.Host + ":" + cfg.Server.Port
		log.Printf("Starting HTTP server on %s", addr)
		if err := router.Run(addr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down gracefully...")
	idx.Stop()
	log.Println("Server stopped")
}
