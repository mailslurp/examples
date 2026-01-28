SHELL := /bin/bash

OS   := $(shell uname -s)
ARCH := $(shell uname -m)

DRIVER_LOCATION := geckodriver

# Linux only
FIREFOX_DIR      := firefox
FIREFOX_LOCATION_LINUX := $(FIREFOX_DIR)/firefox
FIREFOX_TARBALL  := firefox.tar
FIREFOX_URL_LINUX := https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US

# macOS uses installed Firefox
FIREFOX_LOCATION_MAC := /Applications/Firefox.app/Contents/MacOS/firefox

# Geckodriver URLs (yours)
ifeq ($(OS),Darwin)
  ifeq ($(ARCH),arm64)
    DRIVER_URL := https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-macos-aarch64.tar.gz
  else
    DRIVER_URL := https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-macos.tar.gz
  endif
else
  ifeq ($(ARCH),aarch64)
    DRIVER_URL := https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux-aarch64.tar.gz
  else
    DRIVER_URL := https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz
  endif
endif

$(DRIVER_LOCATION):
	curl -fL "$(DRIVER_URL)" | tar -xz
	chmod +x $(DRIVER_LOCATION)

# Linux: download Firefox locally
$(FIREFOX_LOCATION_LINUX):
	rm -rf $(FIREFOX_DIR) firefox.tar firefox
	mkdir -p $(FIREFOX_DIR)
	curl -fL -o $(FIREFOX_TARBALL) "$(FIREFOX_URL_LINUX)"
	tar -xaf $(FIREFOX_TARBALL)
	mv firefox/* $(FIREFOX_DIR)/
	rmdir firefox
	chmod +x $(FIREFOX_LOCATION_LINUX)

# macOS: verify Firefox exists
.PHONY: firefox
firefox:
ifeq ($(OS),Darwin)
	@test -x "$(FIREFOX_LOCATION_MAC)" || (echo "Firefox not found at $(FIREFOX_LOCATION_MAC). Install Firefox or set FIREFOX_LOCATION_MAC."; exit 1)
else
	@$(MAKE) $(FIREFOX_LOCATION_LINUX)
endif

test: $(DRIVER_LOCATION) firefox
ifeq ($(OS),Darwin)
	API_KEY=$(API_KEY) PATH_TO_WEBDRIVER=$(realpath $(DRIVER_LOCATION)) \
	PATH_TO_FIREFOX=$(FIREFOX_LOCATION_MAC) \
	mvn test -Dtest=com.mailslurp.examples.SmsUsageTest
else
	API_KEY=$(API_KEY) PATH_TO_WEBDRIVER=$(realpath $(DRIVER_LOCATION)) \
	PATH_TO_FIREFOX=$(realpath $(FIREFOX_LOCATION_LINUX)) \
	mvn test -Dtest=com.mailslurp.examples.SmsUsageTest
endif

clean:
	rm -rf $(FIREFOX_DIR) firefox.tar geckodriver firefox