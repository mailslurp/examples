-include ../.env

node_modules:
	npm install

dev: node_modules
	CYPRESS_MAILSLURP_API_KEY=$(API_KEY) npm run dev

test: node_modules
	CYPRESS_MAILSLURP_API_KEY=$(API_KEY) npm run test
