-include ../.env

DRIVER_LOCATION=geckodriver
DRIVER_URL=https://github.com/mozilla/geckodriver/releases/download/v0.32.2/geckodriver-v0.32.2-linux64.tar.gz
FIREFOX_LOCATION=firefox/firefox


$(FIREFOX_LOCATION):
	wget --content-disposition "https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US" -O firefox.tar.bz2
	bzip2 -d firefox.tar.bz2
	tar -xf firefox.tar

$(DRIVER_LOCATION):
	curl -s -L "$(DRIVER_URL)" | tar -xz
	chmod +x $(DRIVER_LOCATION)

test: $(DRIVER_LOCATION) $(FIREFOX_LOCATION)
	API_KEY=$(API_KEY) \
	PATH_TO_WEBDRIVER=$(realpath $(DRIVER_LOCATION)) \
	PATH_TO_FIREFOX=$(realpath $(FIREFOX_LOCATION)) \
	mvn install test
