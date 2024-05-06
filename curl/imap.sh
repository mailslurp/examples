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
curl -X 'LIST "" *' -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>
#<gen>curl_imap_search_unseen
curl -X "SEARCH UNSEEN" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>

#<gen>curl_imap_LOGIN
# Login command
curl -vX "LOGIN $IMAP_USERNAME $IMAP_PASSWORD" "imap://mailslurp.click:1143"
#</gen>

#<gen>curl_imap_SELECT
# Select a mailbox
curl -X "SELECT INBOX" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>

#<gen>curl_imap_FETCH
# Fetch messages
curl -X "FETCH 1:* (FLAGS BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)])" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>

#<gen>curl_imap_SEARCH
# Search for unseen messages
curl -X "SEARCH UNSEEN" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>

#<gen>curl_imap_STORE
# Store command to mark messages as seen
curl -X "STORE 1:* +FLAGS (\Seen)" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>

OTHER_INBOX_ADDRESS=$EMAIL_ADDRESS
source .env.account
#<gen>curl_imap_COPY
# Copy messages to another mailbox
curl -X "COPY 1:* $OTHER_INBOX_ADDRESS" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/INBOX"
#</gen>

#<gen>curl_imap_DELETE
# Delete a mailbox
curl -X "DELETE $EMAIL_ADDRESS" -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://mailslurp.click:1143/$IMAP_MAILBOX"
#</gen>
