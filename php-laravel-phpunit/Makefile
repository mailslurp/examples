-include ../.env

composer:
	./install.sh

update:
	php composer.phar update

install:
	php composer.phar install
	php artisan key:generate

build-assets:
	npm run build

dev: build-assets
	API_KEY=$(API_KEY) php artisan config:cache
	API_KEY=$(API_KEY) php artisan serve

fmt:
	./vendor/bin/pint

test: test-unit test-browser

test-unit:
	API_KEY=$(API_KEY) php artisan test

# DUSK_HEADLESS_DISABLED=1
test-browser:
	API_KEY=$(API_KEY) php artisan dusk


test-ci: composer install test
