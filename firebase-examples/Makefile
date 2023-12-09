.PHONY: test
-include ../.env

build:
	npm run build

deploy: build
	npm run deploy

dev:
	npm run dev

test:
	MAILSLURP_API_KEY=$(API_KEY) npm run test-ci