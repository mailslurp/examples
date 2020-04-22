.PHONY: *

php-composer-phpunit:
	cd php-composer-phpunit && $(MAKE) docker

javascript-axios:
	cd javascript-axios && $(MAKE) docker

javascript-jest-puppeteer:
	cd javascript-jest-puppeteer && $(MAKE) docker

javascript-cypress-js:
	cd javascript-cypress-js && $(MAKE) docker

ruby-rspec:
	cd ruby-rspec && $(MAKE) docker

ruby-cucumber-test:
	cd ruby-cucumber-test && $(MAKE) docker

deploy:
	git push origin ci
