-include ../.env

node_modules:
	npm install

docker:
	docker build -t axios --build-arg API_KEY=$(API_KEY) . && docker run axios

test: node_modules
	API_KEY=$(API_KEY) npm t
