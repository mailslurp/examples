-include ../.env
export API_KEY

UV ?= uv
PYTEST_ARGS ?=

.PHONY: install sync test

install: sync
	$(UV) run --no-sync python -m playwright install chromium

sync:
	$(UV) sync --locked

test: sync
	$(UV) run --no-sync python -m pytest $(PYTEST_ARGS)
