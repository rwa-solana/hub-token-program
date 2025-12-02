#!/bin/bash

# Test script for local development

echo "Testing Indexer API endpoints..."
echo ""

BASE_URL="http://localhost:8080"

# Health check
echo "1. Health Check"
curl -s $BASE_URL/health | jq '.'
echo ""

# Get all properties
echo "2. Get All Properties"
curl -s $BASE_URL/api/v1/properties | jq '.data | length'
curl -s $BASE_URL/api/v1/properties | jq '.data[0]' 2>/dev/null
echo ""

# Trigger manual indexing
echo "3. Trigger Manual Indexing"
curl -s -X POST $BASE_URL/api/v1/index/trigger | jq '.'
echo ""

echo "Tests completed!"
