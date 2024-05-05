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
#<gen>curl_get_imap_inbox_access_env
# download access details for an inbox as .env file and source
curl -o .env -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$INBOX_ID" -H"x-api-key:$API_KEY"
# source the .env and connect using variables
source .env
#</gen>
#<gen>curl_imap_connect
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX"
#</gen>
#<gen>curl_smtp_connect_insecure
(echo "HELO test.client"; echo "QUIT") | nc "$SMTP_SERVER_HOST" "$SMTP_SERVER_PORT"
#</gen>
#<gen>curl_smtp_connect_secure
echo -e "HELO test.client\nQUIT\n" | openssl s_client -connect $SMTP_SERVER_HOST:$SMTP_SERVER_PORT -starttls smtp -quiet
#</gen>
#<gen>curl_imap_connect_insecure
curl "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX" -vu "$IMAP_USERNAME:$IMAP_PASSWORD"
#</gen>
#<gen>curl_imap_connect_secure
curl --ssl "imaps://$SECURE_IMAP_SERVER_HOST:$SECURE_IMAP_SERVER_PORT/INBOX" -vu "$SECURE_IMAP_USERNAME:$SECURE_IMAP_PASSWORD"
#</gen>
#<gen>curl_imap_search_unseen
curl -vu "$IMAP_USERNAME:$IMAP_PASSWORD" "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "SEARCH UNSEEN"
#</gen>
#<gen>curl_smtp_helo
echo -e "HELO test.client" | nc "$SMTP_SERVER_HOST" "$SMTP_SERVER_PORT"
#</gen>
#<gen>curl_smtp_verify
echo -e "HELO test.client\nMAIL FROM:<test@example.com>\nRCPT TO:<$EMAIL_ADDRESS>\nQUIT" | nc "$SMTP_SERVER_HOST" "$SMTP_SERVER_PORT"
#</gen>
# assert .env contains IMAP_USERNAME=...
grep IMAP_USERNAME .env
#<gen>curl_get_imap_smtp
# get imap and smtp access details for your account
curl -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access" -H"x-api-key:$API_KEY"
#</gen>
#<gen>curl_get_imap_username
# get username etc
curl -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access" \
  -H"x-api-key:$API_KEY" | jq -j '.imapUsername'
#</gen>
#<gen>curl_get_smtp
# get imap and smtp access details for your account
curl -sXGET "https://api.mailslurp.com/inboxes/smtp-access" -H"x-api-key:$API_KEY"
#</gen>
#<gen>curl_get_smtp_username
curl -sXGET "https://api.mailslurp.com/inboxes/smtp-access" \
  -H"x-api-key:$API_KEY" | jq -j '.smtpUsername'
#</gen>
#<gen>curl_get_smtp_password
curl -sXGET "https://api.mailslurp.com/inboxes/smtp-access" \
  -H"x-api-key:$API_KEY" | jq -j '.smtpPassword'
#</gen>
#<gen>curl_get_imap
# get imap access details for your account
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access" -H"x-api-key:$API_KEY"
#</gen>
#<gen>curl_get_imap_inbox_access
# get imap access for specific inbox
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access?inboxId=$INBOX_ID" -H"x-api-key:$API_KEY"
#</gen>
#<gen>curl_get_imap_username
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access" \
  -H"x-api-key:$API_KEY" | jq -j '.imapUsername'
#</gen>
#<gen>curl_get_imap_password
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access" \
  -H"x-api-key:$API_KEY" | jq -j '.imapPassword'
#</gen>
