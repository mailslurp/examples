# MuleSoft MUnit OTP Test - Makefile
# ==================================

# Load environment variables from parent .env if exists
ifneq (,$(wildcard ../.env))
    include ../.env
    export
endif

# Default target
.DEFAULT_GOAL := help

# Maven command
MVN := mvn

# ============================================
# Help
# ============================================
.PHONY: help
help: ## Show this help message
	@echo "MuleSoft MUnit OTP Test - Available Commands"
	@echo "============================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Environment:"
	@echo "  MAILSLURP_API_KEY: $(if $(MAILSLURP_API_KEY),set,NOT SET - required for tests)"

# ============================================
# Test Targets
# ============================================
.PHONY: test
test: check-env ## Run all tests (MUnit + standard)
	@echo "Running all tests..."
	$(MVN) test

.PHONY: test_maven
test_maven: check-env ## Run Maven tests
	@echo "Running Maven tests..."
	$(MVN) test

.PHONY: test_munit
test_munit: check-env ## Run MUnit tests specifically
	@echo "Running MUnit tests..."
	$(MVN) test -DskipTests=true -Dmunit.test=*

.PHONY: test_verbose
test_verbose: check-env ## Run tests with verbose output
	@echo "Running tests with verbose output..."
	$(MVN) test -X

# ============================================
# Build Targets
# ============================================
.PHONY: compile
compile: ## Compile the project
	@echo "Compiling project..."
	$(MVN) compile

.PHONY: package
package: ## Package the Mule application
	@echo "Packaging Mule application..."
	$(MVN) package -DskipTests

.PHONY: install
install: ## Install to local Maven repository
	@echo "Installing to local repository..."
	$(MVN) install -DskipTests

# ============================================
# Clean Targets
# ============================================
.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	$(MVN) clean

.PHONY: clean_all
clean_all: clean ## Clean everything including IDE files
	@echo "Cleaning IDE files..."
	rm -rf .idea *.iml .project .classpath .settings

# ============================================
# Utility Targets
# ============================================
.PHONY: deps
deps: ## Download dependencies
	@echo "Downloading dependencies..."
	$(MVN) dependency:resolve

.PHONY: tree
tree: ## Show dependency tree
	$(MVN) dependency:tree

.PHONY: validate
validate: ## Validate POM
	$(MVN) validate

.PHONY: check-env
check-env:
	@if [ -z "$(MAILSLURP_API_KEY)" ]; then \
		echo "ERROR: MAILSLURP_API_KEY environment variable is not set"; \
		echo ""; \
		echo "Set it with: export MAILSLURP_API_KEY=your_api_key"; \
		echo "Or create ../.env file with: MAILSLURP_API_KEY=your_api_key"; \
		exit 1; \
	fi
	@echo "✓ MAILSLURP_API_KEY is set"
