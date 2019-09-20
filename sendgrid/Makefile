node_modules:
	npm install

include ../.env
include .env
test: node_modules
	SENDGRID_API_KEY=$(SENDGRID_API_KEY) API_KEY=$(API_KEY) npx jest
