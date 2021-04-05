-include ../.env

bundler:
	gem install bundler

vendor:
	bundle install --path ./vendor/bundle

test: 
	API_KEY=$(API_KEY) bundle exec cucumber
