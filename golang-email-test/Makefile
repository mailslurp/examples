-include ../.env

test:
	go get github.com/stretchr/testify/assert
	go get golang.org/x/oauth2
	go get golang.org/x/net/context
	go get github.com/antihax/optional
	go get github.com/mailslurp/mailslurp-client-go
	API_KEY=$(API_KEY) go test
