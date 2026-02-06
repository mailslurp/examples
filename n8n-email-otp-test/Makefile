.PHONY: help install start test clean import-workflow

# Default target
.DEFAULT_GOAL := help

# Environment
API_KEY ?= $(MAILSLURP_API_KEY)
N8N_PORT ?= 5678
N8N_BASIC_AUTH_ACTIVE ?= false

help: ## Show this help message
	@echo "n8n Email OTP Test - Makefile Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

start: ## Start n8n workflow server
	@echo "Starting n8n on port $(N8N_PORT)..."
	@if [ -z "$(API_KEY)" ]; then \
		echo "⚠️  Warning: MAILSLURP_API_KEY not set. Export it or set in n8n UI."; \
	fi
	@echo "Access n8n UI at: http://localhost:$(N8N_PORT)"
	N8N_PORT=$(N8N_PORT) \
	N8N_BASIC_AUTH_ACTIVE=$(N8N_BASIC_AUTH_ACTIVE) \
	MAILSLURP_API_KEY=$(API_KEY) \
	npx n8n start

test: ## Run standalone OTP verification test
	@echo "Running OTP verification test..."
	@if [ -z "$(API_KEY)" ]; then \
		echo "❌ Error: MAILSLURP_API_KEY not set"; \
		echo "   Export it: export MAILSLURP_API_KEY=your_key_here"; \
		exit 1; \
	fi
	MAILSLURP_API_KEY=$(API_KEY) node test/otp-verification-test.js

test-verbose: ## Run test with verbose output
	@echo "Running OTP verification test (verbose)..."
	MAILSLURP_API_KEY=$(API_KEY) DEBUG=* node test/otp-verification-test.js

import-workflow: ## Import workflow into running n8n instance
	@echo "Importing workflow..."
	@if ! curl -s http://localhost:$(N8N_PORT) > /dev/null 2>&1; then \
		echo "❌ Error: n8n is not running on port $(N8N_PORT)"; \
		echo "   Start n8n first: make start"; \
		exit 1; \
	fi
	@echo "⚠️  Manual import required:"
	@echo "   1. Open http://localhost:$(N8N_PORT)"
	@echo "   2. Click 'Import from File'"
	@echo "   3. Select workflows/otp-verification-workflow.json"

check-api-key: ## Verify API key is set and valid
	@echo "Checking API key..."
	@if [ -z "$(API_KEY)" ]; then \
		echo "❌ MAILSLURP_API_KEY not set"; \
		exit 1; \
	fi
	@echo "Testing API key..."
	@curl -s -H "x-api-key: $(API_KEY)" https://api.mailslurp.com/inboxes?page=0&size=1 > /dev/null && \
		echo "✅ API key is valid" || \
		echo "❌ API key is invalid"

dev: install start ## Install deps and start n8n (dev workflow)

clean: ## Remove node_modules and lock files
	@echo "Cleaning up..."
	rm -rf node_modules package-lock.json
	@echo "✅ Cleaned"

clean-n8n: ## Remove n8n data directory
	@echo "Removing n8n data..."
	rm -rf ~/.n8n
	@echo "✅ n8n data removed"

status: ## Check if n8n is running
	@if curl -s http://localhost:$(N8N_PORT) > /dev/null 2>&1; then \
		echo "✅ n8n is running at http://localhost:$(N8N_PORT)"; \
	else \
		echo "❌ n8n is not running"; \
	fi

logs: ## Show n8n logs (if running in background)
	@tail -f ~/.n8n/logs/n8n.log 2>/dev/null || echo "No log file found. Is n8n running?"
