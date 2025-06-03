-include ../.env

#<gen>jmeter_make_download
DRIVER_LOCATION=jmeter/bin/jmeter
DRIVER_URL=https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.zip
ZIP_FILE=jmeter.zip

$(DRIVER_LOCATION):
	curl -L -o $(ZIP_FILE) $(DRIVER_URL)
	unzip -q $(ZIP_FILE)
	rm -f $(ZIP_FILE)
	mv apache-jmeter-* jmeter
	chmod +x $(DRIVER_LOCATION)
#</gen>

test-junit:
	API_KEY=$(API_KEY) mvn install test

# use jdk 17
test: $(DRIVER_LOCATION)
	@java -version 2>&1 | grep '"17' > /dev/null || (echo "Error: Java 17 required"; exit 1)
	$(DRIVER_LOCATION) -JAPI_KEY=$(API_KEY) -n -t EmailLoadTest.jmx -l results.jtl

test-ui: $(DRIVER_LOCATION)
	@java -version 2>&1 | grep '"17' > /dev/null || (echo "Error: Java 17 required"; exit 1)
	$(DRIVER_LOCATION) -JAPI_KEY=$(API_KEY) -t EmailLoadTest.jmx
