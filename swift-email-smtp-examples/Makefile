-include ../.env

Package.resolved:
	swift package update

test: Package.resolved
	API_KEY=$(API_KEY) swift test

test-ci: Package.resolved test