.PHONY: build run test clean docker-build docker-run deps

# Build the application
build:
	go build -o bin/indexer ./cmd/main.go

# Run the application
run:
	go run ./cmd/main.go

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Install dependencies
deps:
	go mod download
	go mod tidy

# Build Docker image
docker-build:
	docker build -t hub-indexer:latest .

# Run Docker container
docker-run:
	docker run -p 8080:8080 --env-file .env hub-indexer:latest

# Development mode with hot reload (requires air)
dev:
	air

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Generate mocks (if using mockgen)
mocks:
	mockgen -source=internal/indexer/indexer.go -destination=internal/indexer/mocks/indexer_mock.go
