-include ../.env

composer:
	./install.sh

update:
	php composer.phar update

install:
	php composer.phar install

test:
	API_KEY=$(API_KEY) php ./vendor/bin/codecept run --steps
