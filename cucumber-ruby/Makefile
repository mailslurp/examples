vendor:
	bundle install --path ./vendor/bundle

test: vendor
	API_KEY=$(API_KEY) bundle exec cucumber
