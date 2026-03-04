include ../.env

.PHONY: test

MAILSLURP_API_KEY ?= $(API_KEY)
MAILSLURP_BASE_URL ?= https://api.mailslurp.com
TEST_ENDPOINTS_BASE_URL ?= $(MAILSLURP_BASE_URL)
TEST_PASSWORD ?= TestPass123!
WAIT_TIMEOUT_MS ?= 120000

test:
	@if [ -z "$(MAILSLURP_API_KEY)" ]; then \
		echo "MAILSLURP_API_KEY is required (or set API_KEY in ../.env)"; \
		exit 1; \
	fi
	@if ! command -v hurl >/dev/null 2>&1; then \
		echo "hurl CLI is required: https://hurl.dev/docs/installation.html"; \
		exit 1; \
	fi
	hurl \
		--variable MAILSLURP_BASE_URL="$(MAILSLURP_BASE_URL)" \
		--variable TEST_ENDPOINTS_BASE_URL="$(TEST_ENDPOINTS_BASE_URL)" \
		--variable MAILSLURP_API_KEY="$(MAILSLURP_API_KEY)" \
		--variable TEST_PASSWORD="$(TEST_PASSWORD)" \
		--variable WAIT_TIMEOUT_MS="$(WAIT_TIMEOUT_MS)" \
		hurl/signup-email-otp-flow.hurl
