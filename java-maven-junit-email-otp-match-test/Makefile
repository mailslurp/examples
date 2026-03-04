include ../.env

.PHONY: test

MAILSLURP_API_KEY ?= $(API_KEY)
MAILSLURP_BASE_URL ?= https://api.mailslurp.com
TEST_ENDPOINTS_BASE_URL ?= $(MAILSLURP_BASE_URL)
TEST_PASSWORD ?= TestPass123!
WAIT_TIMEOUT_MS ?= 120000
SUBJECT_MATCH ?= Please confirm your email address

test:
	@if [ -z "$(MAILSLURP_API_KEY)" ]; then \
		echo "MAILSLURP_API_KEY is required (or set API_KEY in ../.env)"; \
		exit 1; \
	fi
	@if ! command -v mvn >/dev/null 2>&1; then \
		echo "mvn is required. Install Maven to run this test."; \
		exit 1; \
	fi
	MAILSLURP_API_KEY="$(MAILSLURP_API_KEY)" \
	MAILSLURP_BASE_URL="$(MAILSLURP_BASE_URL)" \
	TEST_ENDPOINTS_BASE_URL="$(TEST_ENDPOINTS_BASE_URL)" \
	TEST_PASSWORD="$(TEST_PASSWORD)" \
	WAIT_TIMEOUT_MS="$(WAIT_TIMEOUT_MS)" \
	SUBJECT_MATCH="$(SUBJECT_MATCH)" \
	mvn -q -Dtest=EmailOtpMatchFlowTest test

