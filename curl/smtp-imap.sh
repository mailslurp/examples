#!/usr/bin/env bash
set -e
error_handling() {
    echo "ERROR occurred"
    exit 1
}

trap 'error_handling' ERR
inboxId=$(curl -sXPOST "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -H"x-api-key:$API_KEY" | jq -r '.id')
#<gen>curl_get_imap_inbox_access_env
# download access details for an inbox as .env file and source
curl -o .env -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$inboxId" -H"x-api-key:$API_KEY"
# source the .env and connect using variables
source .env && curl -u "$IMAP_USERNAME:$IMAP_PASSWORD" \
  "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/$IMAP_MAILBOX" -X "SEARCH UNSEEN"
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
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access?inboxId=$inboxId" -H"x-api-key:$API_KEY"
#</gen>
#<gen>curl_get_imap_username
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access" \
  -H"x-api-key:$API_KEY" | jq -j '.imapUsername'
#</gen>
#<gen>curl_get_imap_password
curl -sXGET "https://api.mailslurp.com/inboxes/imap-access" \
  -H"x-api-key:$API_KEY" | jq -j '.imapPassword'
#</gen>
