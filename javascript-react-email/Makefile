-include ../.env
.PHONY: test

node_modules:
	npm install

docker:


test: node_modules
	API_KEY=$(API_KEY) npm t
