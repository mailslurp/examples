-include ../.env

docker:
	docker build -t rspec --build-arg API_KEY=$(API_KEY) . && docker run rspec

vendor:
	bundle install --path ./vendor/bundle

test: vendor
	API_KEY=$(API_KEY) bundle exec rspec example.spec.rb
