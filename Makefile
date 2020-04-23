.PHONY: *

php-composer-phpunit:
	cd php-composer-phpunit && $(MAKE) docker

javascript-axios:
	cd javascript-axios && $(MAKE) docker

javascript-jest-puppeteer:
	cd javascript-jest-puppeteer && $(MAKE) test

javascript-cypress-js:
	cd javascript-cypress-js && $(MAKE) test

ruby-rspec:
	cd ruby-rspec && $(MAKE) docker

ruby-cucumber-test:
	cd ruby-cucumber-test && $(MAKE) docker

python2-pytest:
	cd python2-pytest && $(MAKE) test

deploy:
	git push ci master
