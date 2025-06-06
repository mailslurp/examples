-include ../.env

test:
	for f in scripts/*.js; do \
		API_KEY=$(API_KEY) k6 run "$$f"; \
	done