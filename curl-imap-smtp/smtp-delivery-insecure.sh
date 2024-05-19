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

# Sender and recipient email addresses
SENDER_EMAIL="test@mailslurp.dev"
RECIPIENT_EMAIL="$EMAIL_ADDRESS"

# Email content
SUBJECT="Test Email"
echo "Subject: $SUBJECT" > email.txt

echo "---------------- SMTP"
#<gen>curl_smtp_delivery
# Deliver email using curl insecure
curl -v --url "smtp://mxslurp.click:2525" \
     --mail-from "$SENDER_EMAIL" \
     --mail-rcpt "$RECIPIENT_EMAIL" \
     --upload-file email.txt \
#</gen>
curl -v -XGET "https://api.mailslurp.com/waitForLatestEmail?inboxId=$INBOX_ID&unreadOnly=true&apiKey=$API_KEY"