#!/usr/bin/env bash
# get an inbox with smtp/imap capabilties
INBOX_TYPE="HTTP_INBOX"
INBOX=$(curl -sXPOST "https://api.mailslurp.com/inboxes?inboxType=$INBOX_TYPE&expiresIn=300000" -H"x-api-key:$API_KEY")

# get inbox imap access details
ACCESS=$(curl -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access" -Hx-api-key:$API_KEY)

# set vars for imap expect
export ADDRESS=$(echo $INBOX | jq -j '.emailAddress')
INBOX_ID=$(echo $INBOX | jq -j '.id')
export USERNAME=$(echo "$ACCESS" | jq -j '.smtpUsername')
export PASSWORD=$(echo "$ACCESS" | jq -j '.smtpPassword')
export PORT=$(echo "$ACCESS" | jq -j '.smtpServerPort')
export HOST=$(echo "$ACCESS" | jq -j '.smtpServerHost')
#<gen>telnet_smtp_auth_plain_encoding
auth_string="\0$USERNAME\0$PASSWORD"
base64_auth=$(echo -ne "$auth_string" | base64)
auth_plain_command="AUTH PLAIN $base64_auth"
#</gen>
export USERNAME_PASSWORD_BASE64=$base64_auth
# execute the expect test to connect to the server using the set variables
./smtp-example.exp
curl -v -XGET "https://api.mailslurp.com/waitForLatestEmail?inboxId=$INBOX_ID&unreadOnly=true&apiKey=$API_KEY"
