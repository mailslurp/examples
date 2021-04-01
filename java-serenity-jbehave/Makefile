-include ../.env

test:
	API_KEY=$(API_KEY) mvn install test

report:
	firefox ./target/site/serenity/index.html
