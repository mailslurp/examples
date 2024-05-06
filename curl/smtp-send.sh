#!/bin/bash
set -e
error_handling() {
    echo "ERROR occurred"
    exit 1
}

trap 'error_handling' ERR
# SMTP server details
response=$(curl -sXPOST "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -H"x-api-key:$API_KEY")
INBOX_ID=$(echo "$response" | jq -r '.id')
EMAIL_ADDRESS=$(echo "$response" | jq -r '.emailAddress')

# download access details for an inbox as .env file and source
access=$(curl -sXGET "https://api.mailslurp.com/inboxes/imap-smtp-access?inboxId=$INBOX_ID" -H"x-api-key:$API_KEY")
SMTP_USERNAME=$(echo "$access" | jq -r '.smtpUsername')
SMTP_PASSWORD=$(echo "$access" | jq -r '.smtpPassword')

# Sender and recipient email addresses
RECIPIENT_EMAIL="$EMAIL_ADDRESS"
SENDER_EMAIL="$EMAIL_ADDRESS"

#<gen>curl_smtp_send
# Email content
cat <<EOF >>email.txt
From: Jack <$SENDER_EMAIL>
To: Joe <$RECIPIENT_EMAIL>
Subject: SMTP example
Date: Mon, 7 Nov 2016 03:45:06

Dear Joe,
How splendid life is.
EOF
# Send email using curl
curl -v --url "smtp://mxslurp.click:2525" \
     --user "$SMTP_USERNAME:$SMTP_PASSWORD" \
     --mail-from "$SENDER_EMAIL" \
     --mail-rcpt "$RECIPIENT_EMAIL" \
     --upload-file email.txt
#</gen>
curl -v -XGET "https://api.mailslurp.com/waitForLatestEmail?inboxId=$INBOX_ID&unreadOnly=true&apiKey=$API_KEY"