-include ../.env

node_modules:
	npm install

clean:
	rm -rf artifacts

fmt:
	npm run fmt

test: node_modules
	API_KEY=$(API_KEY) npm t
