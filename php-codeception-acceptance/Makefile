-include ../.env

DRIVER_LOCATION=geckodriver
DRIVER_URL=https://github.com/mozilla/geckodriver/releases/download/v0.26.0/geckodriver-v0.26.0-linux64.tar.gz

$(DRIVER_LOCATION):
	curl -s -L "$(DRIVER_URL)" | tar -xz
	chmod +x $(DRIVER_LOCATION)

SELENIUM_LOCATION=selenium-server.jar
SELENIUM_URL=https://selenium-release.storage.googleapis.com/3.141/selenium-server-standalone-3.141.59.jar

$(SELENIUM_LOCATION):
	curl -L --output $(SELENIUM_LOCATION) $(SELENIUM_URL)

composer:
	./install.sh

update:
	php composer.phar update

install:
	php composer.phar install

test: $(DRIVER_LOCATION) $(SELENIUM_LOCATION)
	API_KEY=$(API_KEY) php vendor/bin/codecept run --steps
