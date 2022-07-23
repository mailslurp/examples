-include ../.env

install:
	dotnet restore
	dotnet build

test:
	API_KEY=$(API_KEY) dotnet test

