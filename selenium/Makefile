include ../.env
include .env

GECKO=geckodriver-v0.25.0-linux64.tar.gz

geckodriver:
	curl -OL https://github.com/mozilla/geckodriver/releases/download/v0.25.0/$(GECKO)
	tar xvf $(GECKO)


test: geckodriver
	GECKO_DRIVER=$(PWD)/geckodriver WEBSITE_URL=$(WEBSITE_URL) API_KEY=$(API_KEY) ./gradlew clean test
