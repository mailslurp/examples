#!/usr/bin/env bash
#<gen>curl_get_imap_smtp
# get imap and smtp access details for your account
curl -XGET "https://api.mailslurp.com/inboxes/imap-smtp-access" -Hx-api-key:$API_KEY
#</gen>
#<gen>curl_get_imap_username
# get username etc
curl -XGET "https://api.mailslurp.com/inboxes/imap-smtp-access" \
  -Hx-api-key:$API_KEY | jq -j '.imapUsername'
#</gen>
