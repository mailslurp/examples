-include ../.env

fmt:
	./gradlew spotlessApply

test:
	API_KEY=$(API_KEY) ./gradlew clean test
