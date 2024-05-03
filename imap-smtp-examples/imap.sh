#!/bin/bash

# Load the .env file
echo "Loading the .env file..."
source .env

# Connect to the mail server and list unread emails
echo "Connecting to the mail server and listing unread emails..."
curl -v --insecure -u $IMAP_USERNAME:$IMAP_PASSWORD --url "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX" -X 'SEARCH UNSEEN'

# Fetch the first email and print its subject
echo "Fetching the first email and printing its subject..."
curl -v --insecure -u $IMAP_USERNAME:$IMAP_PASSWORD --url "imap://$IMAP_SERVER_HOST:$IMAP_SERVER_PORT/INBOX;UID=1" -X 'FETCH 1 BODY[HEADER.FIELDS (SUBJECT)]'