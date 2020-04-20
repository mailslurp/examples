-include ../.env

docker:
	docker build -t php --build-arg API_KEY=$(API_KEY) . && docker run php

update:
	php composer.phar update

test:
	php composer.phar install
	API_KEY=$(API_KEY) ./vendor/bin/phpunit test
