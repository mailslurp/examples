#!/usr/bin/env bash
# get an inbox with smtp/imap capabilties
INBOX=$(curl -sXPOST "https://api.mailslurp.com/inboxes?expiresIn=300000" -H"x-api-key:$API_KEY")
INBOX_ID=$(echo $INBOX | jq -j '.id')

# update the inbox access
curl -sXPATCH "https://api.mailslurp.com/inboxes/imap-access?inboxId=$INBOX_ID" -H'content-type: application/json' -Hx-api-key:$API_KEY -d '{"imapUsername":"test-user", "imapPassword": "test-pass"}'

# get inbox imap access details
ACCESS=$(curl -sXGET "https://api.mailslurp.com/inboxes/imap-access?inboxId=$INBOX_ID" -Hx-api-key:$API_KEY)

# set vars for imap expect
export ADDRESS=$(echo $INBOX | jq -j '.emailAddress')
export USERNAME=$(echo "$ACCESS" | jq -j '.imapUsername')
export PASSWORD=$(echo "$ACCESS" | jq -j '.imapPassword')

# expect access is set
if [ "$USERNAME" != "test-user" ]; then
  echo "Error: expected username $USERNAME to be test-user"
  exit 1
fi
if [ "$PASSWORD" != "test-pass" ]; then
  echo "Error: expected password $PASSWORD to be test-pass"
  exit 1
fi

export PORT=$(echo "$ACCESS" | jq -j '.imapServerPort')
export HOST=$(echo "$ACCESS" | jq -j '.imapServerHost')

# send a message to the inbox
curl -XPOST "https://api.mailslurp.com/sendEmailQuery?to=$ADDRESS&body=Hello&subject=Test" -Hx-api-key:$API_KEY

# execute the expect test to connect to the server using the set variables
./imap-example.exp

