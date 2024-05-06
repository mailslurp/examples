#!/usr/bin/env bash
set -e
error_handling() {
    echo "ERROR occurred"
    exit 1
}
trap 'error_handling' ERR

response=$(curl -sXPOST "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -H"x-api-key:$API_KEY")
INBOX_ID=$(echo "$response" | jq -r '.id')
EMAIL_ADDRESS=$(echo "$response" | jq -r '.emailAddress')

curl -o .env.inbox -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$INBOX_ID" -H"x-api-key:$API_KEY"
curl -o .env.account -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access/env" -H"x-api-key:$API_KEY"

# test with inbox access
source .env.inbox
# Ensure the environment variables are set
if [[ -z "$IMAP_USERNAME" || -z "$IMAP_PASSWORD" || -z "$IMAP_SERVER_HOST" || -z "$IMAP_SERVER_PORT" || -z "$IMAP_MAILBOX" ]]; then
    echo "Please set all required environment variables."
    exit 1
fi

echo "--- IMAP INSECURE"
#<gen>curl_imap_connect
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX"
#</gen>
#<gen>curl_imap_connect_insecure
curl "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX" -vu "$IMAP_USERNAME:$IMAP_PASSWORD"
#</gen>

echo "--- IMAP SECURE"
#<gen>curl_imap_connect_secure
curl --ssl "imaps://$SECURE_IMAP_SERVER_HOST:$SECURE_IMAP_SERVER_PORT/INBOX" -vu "$SECURE_IMAP_USERNAME:$SECURE_IMAP_PASSWORD"
#</gen>

echo "--- IMAP commands"
#<gen>curl_imap_search_list
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X 'LIST "" *'
#</gen>
#<gen>curl_imap_search_unseen
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "SEARCH UNSEEN"
#</gen>

#<gen>curl_imap_LOGIN
# Login command
curl "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/" -vX "LOGIN $IMAP_USERNAME $IMAP_PASSWORD"
#</gen>

#<gen>curl_imap_SELECT
# Select a mailbox
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "SELECT INBOX"
#</gen>

#<gen>curl_imap_FETCH
# Fetch messages
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "FETCH 1:* (FLAGS BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)])"
#</gen>

#<gen>curl_imap_SEARCH
# Search for unseen messages
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "SEARCH UNSEEN"
#</gen>

#<gen>curl_imap_STORE
# Store command to mark messages as seen
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "STORE 1:* +FLAGS (\Seen)"
#</gen>

OTHER_INBOX_ADDRESS=$EMAIL_ADDRESS
source .env.account
#<gen>curl_imap_COPY
# Copy messages to another mailbox
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX" -X "COPY 1:* $OTHER_INBOX_ADDRESS"
#</gen>

#<gen>curl_imap_DELETE
# Delete a mailbox
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "DELETE $EMAIL_ADDRESS"
#</gen>
