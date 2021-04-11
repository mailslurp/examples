-include ../.env

install:
	nimble install

fmt:
	nimpretty

test: $(DRIVER_LOCATION) $(SELENIUM_LOCATION)
	API_KEY=$(API_KEY) testament r tests/test_emails.nim
