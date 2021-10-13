-include ../.env

composer:
	./install.sh

update:
	php composer.phar update

install:
	php composer.phar install

test:
	API_KEY=$(API_KEY) ./vendor/bin/phpunit test

test-ci: composer install test