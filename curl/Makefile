-include ../.env
.PHONY: test
test:
	API_KEY=$(API_KEY) ./smtp-imap.sh
	API_KEY=$(API_KEY) ./curl-example.sh
 
