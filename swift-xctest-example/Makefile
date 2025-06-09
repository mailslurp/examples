include: ../.env

.PHONY: install build test clean

SWIFT := swift

# fetch & resolve dependencies
install:
	$(SWIFT) package resolve

# compile library + tests
build: install
	$(SWIFT) build --disable-sandbox

# run XCTest (requires MAILSLURP_API_KEY env var)
test: build
	API_KEY=$(API_KEY) $(SWIFT) test --disable-sandbox

# clean build artifacts
clean:
	$(SWIFT) package clean

xcode-generate:
	xcodegen generate --spec xcodegen.yml

xcode-open:
	open swift-xctest-example.xcodeproj
