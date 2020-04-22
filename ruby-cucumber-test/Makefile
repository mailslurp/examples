-include ../.env

docker:
	docker build -t cucumber --build-arg API_KEY=$(API_KEY) . && docker run cucumber

vendor:
	bundle install --path ./vendor/bundle

test: vendor
	API_KEY=$(API_KEY) bundle exec cucumber
