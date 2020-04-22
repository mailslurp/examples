-include ../.env

node_modules:
	npm install

docker:
	docker build -t puppeteer --build-arg API_KEY=$(API_KEY) . && docker run puppeteer

test: node_modules
	API_KEY=$(API_KEY) npm t
