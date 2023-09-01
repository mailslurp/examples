-include ../.env

node_modules:
	npm install

fmt:
	npm run fmt

test: node_modules
	API_KEY=$(API_KEY) npm t
