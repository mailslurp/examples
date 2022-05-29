-include ../.env

.PHONY: test

node_modules:
	npm install

test: node_modules
	API_KEY=$(API_KEY) npx playwright test
