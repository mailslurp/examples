-include ../.env

.PHONY: test

node_modules:
	npm install

test: node_modules
	API_KEY=$(API_KEY) npx playwright test

sync-results:
	aws s3 sync test-results/ s3://api-spec.mailslurp.com/test-results/playwright-sms --exact-timestamps
	aws s3 sync screenshots/ s3://api-spec.mailslurp.com/test-screenshots/playwright-sms --exact-timestamps
