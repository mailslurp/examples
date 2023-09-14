#!/usr/bin/env bash
# get an inbox with smtp/imap capabilties
INBOX=$(curl -sXGET "https://api.mailslurp.com/inboxes/paginated?size=1&inboxType=SMTP_INBOX" -Hx-api-key:$API_KEY)

# get inbox imap access details
ACCESS=$(curl -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access" -Hx-api-key:$API_KEY)

# set vars for imap expect
export ADDRESS=$(echo $INBOX | jq -j '.content[0].emailAddress')
export USERNAME=$(echo "$ACCESS" | jq -j '.imapUsername')
export PASSWORD=$(echo "$ACCESS" | jq -j '.imapPassword')
export PORT=$(echo "$ACCESS" | jq -j '.imapServerPort')
export HOST=$(echo "$ACCESS" | jq -j '.imapServerHost')

# send a message to the inbox
curl -XPOST "https://api.mailslurp.com/sendEmailQuery?to=$ADDRESS&body=Hello&subject=Test" -Hx-api-key:$API_KEY

# execute the expect test to connect to the server using the set variables
./imap-example.exp

