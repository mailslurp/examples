-include ../.env

.PHONY: test

node_modules:
	npm install

test: node_modules
	API_KEY=$(API_KEY) PATH_TO_ATTACHMENT=$(PWD)/My-Data_with-specialName.csv npm t
