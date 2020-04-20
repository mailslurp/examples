-include ../.env

node_modules:
	npm install

test: node_modules
	API_KEY=$(API_KEY) npm t
