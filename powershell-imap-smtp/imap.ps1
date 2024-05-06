# Set strict mode and error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function ErrorHandling {
    Write-Host "ERROR occurred"
    exit 1
}
trap { ErrorHandling }

# load functions
. .\_helpers.ps1

# Set API key environment variable (Assuming it's set elsewhere in the environment)
$apiKey = $env:API_KEY

# Create a new SMTP inbox and parse JSON response
$response = Invoke-RestMethod -Method Post -Uri "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -Headers @{ "x-api-key" = $apiKey }
$inboxId = $response.id
$emailAddress = $response.emailAddress

# Fetch environment variables for inbox and account access
Invoke-RestMethod -Method Get -Uri "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$inboxId" -Headers @{ "x-api-key" = $apiKey } -OutFile ".env.inbox"
Invoke-RestMethod -Method Get -Uri "https://api.mailslurp.com/inboxes/imap-smtp-access/env" -Headers @{ "x-api-key" = $apiKey } -OutFile ".env.account"

# Load environment variables from downloaded files
Load-EnvironmentVariables -filePath ".\.env.inbox"

# Ensure the environment variables are set
if (-not $env:IMAP_USERNAME -or -not $env:IMAP_PASSWORD -or -not $env:IMAP_SERVER_HOST -or -not $env:IMAP_SERVER_PORT) {
    Write-Host "Please set all required environment variables."
    exit 1
}

Write-Host "--- IMAP INSECURE"
#<gen>ps1_imap_connect
curl -v -u "$($env:IMAP_USERNAME):$($env:IMAP_PASSWORD)" "imap://$($env:IMAP_SERVER_HOST):$($env:IMAP_SERVER_PORT)/INBOX"
#</gen>
#<gen>ps1_imap_connect_secure
Write-Host "--- IMAP SECURE"
curl --ssl "imaps://$env:SECURE_IMAP_SERVER_HOST:$env:SECURE_IMAP_SERVER_PORT/INBOX" -vu "$env:SECURE_IMAP_USERNAME:$env:SECURE_IMAP_PASSWORD"
#</gen>

Write-Host "--- IMAP commands"
#<gen>ps1_imap_search_list
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X 'LIST "" *'
#</gen>
#<gen>ps1_imap_search_unseen
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "SEARCH UNSEEN"
#</gen>

#<gen>ps1_imap_LOGIN
curl "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/" -vX "LOGIN $env:IMAP_USERNAME $env:IMAP_PASSWORD"
#</gen>
#<gen>ps1_imap_SELECT
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "SELECT INBOX"
#</gen>
#<gen>ps1_imap_FETCH
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "FETCH 1:* (FLAGS BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)])"
#</gen>
#<gen>ps1_imap_SEARCH
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "SEARCH UNSEEN"
#</gen>
#<gen>ps1_imap_STORE
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "STORE 1:* +FLAGS (\Seen)"
#</gen>
$otherInboxAddress = $emailAddress
Load-EnvironmentVariables -filePath ".\.env.account"

#<gen>ps1_imap_COPY
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/INBOX" -X "COPY 1:* $otherInboxAddress"
#</gen>
#<gen>ps1_imap_DELETE
curl -vu "$env:IMAP_USERNAME:$env:IMAP_PASSWORD" "imap://$env:IMAP_SERVER_HOST:$env:IMAP_SERVER_PORT/$env:IMAP_MAILBOX" -X "DELETE $emailAddress"
#</gen>
