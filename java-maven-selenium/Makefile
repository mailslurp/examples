-include ../.env


DRIVER_LOCATION=geckodriver
PLATFORM_ID != uname -s
DRIVER_URL != if [ $(PLATFORM_ID) = Linux ]; then \
        echo https://github.com/mozilla/geckodriver/releases/download/v0.26.0/geckodriver-v0.26.0-linux64.tar.gz; \
    else \
        echo https://github.com/mozilla/geckodriver/releases/download/v0.26.0/geckodriver-v0.26.0-macos.tar.gz; \
    fi

clean:
	rm $(DRIVER_LOCATION)

$(DRIVER_LOCATION):
	curl -s -L "$(DRIVER_URL)" | tar -xz
	chmod +x $(DRIVER_LOCATION)

test: $(DRIVER_LOCATION)
	API_KEY=$(API_KEY) \
	PATH_TO_WEBDRIVER=$(realpath $(DRIVER_LOCATION)) \
	mvn install test
