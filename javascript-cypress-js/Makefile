-include ../.env

node_modules:
	npm install

docker:
	docker build -t cypress --build-arg API_KEY=$(API_KEY) . && docker run cypress

test: node_modules
	CYPRESS_API_KEY=$(API_KEY) npm run test
