-include ../.env
.PHONY: test

install:
	dart pub get

fmt:
	dart format test

test:
	API_KEY=$(API_KEY) dart test test/email-test.dart
 
