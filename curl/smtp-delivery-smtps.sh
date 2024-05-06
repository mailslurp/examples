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

echo "---------------- SMTPS"
#<gen>curl_smtp_delivery_smtps
# Deliver email using curl with SMTPS
curl -v --url "smtps://mailslurp.mx:465" \
     --mail-from "$SENDER_EMAIL" \
     --mail-rcpt "$RECIPIENT_EMAIL" \
     --upload-file email.txt \
#</gen>
curl -v -XGET "https://api.mailslurp.com/waitForLatestEmail?inboxId=$INBOX_ID&unreadOnly=true&apiKey=$API_KEY"
echo "---------------- SMTPS encrypted"
#<gen>curl_smtp_delivery_smtps_encrypted
# Deliver email using curl with SMTPS encrypted
curl -v --url "smtps://mailslurp.mx:465" \
     --mail-from "$SENDER_EMAIL" \
     --mail-rcpt "$RECIPIENT_EMAIL" \
     --upload-file email.txt \
     --ssl-reqd
#</gen>
curl -v -XGET "https://api.mailslurp.com/waitForLatestEmail?inboxId=$INBOX_ID&unreadOnly=true&apiKey=$API_KEY"
