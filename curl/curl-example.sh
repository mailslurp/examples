#!/usr/bin/env bash
#<gen>create_inbox
curl -XPOST api.mailslurp.com/createInbox -Hx-api-key:$API_KEY
#</gen>

RES=$(curl -sXPOST api.mailslurp.com/createInbox -Hx-api-key:$API_KEY)
TO=$(echo "$RES" | jq .emailAddress)
ID=$(echo "$RES" | jq .id)

#<gen>curl_send_email_query
curl -XPOST "api.mailslurp.com/sendEmailQuery?to=$TO&subject=Test&body=Hello%20World" -Hx-api-key:$API_KEY
#</gen>
