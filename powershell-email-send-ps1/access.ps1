$API_KEY = $env:API_KEY
$response = Invoke-RestMethod -Uri "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -Method Post -Headers @{"x-api-key" = $API_KEY}
$inboxId = $response.id
#<gen>ps1_access_mailbox
# download access details for an inbox as .env file
Set-Location $PSScriptRoot
Invoke-WebRequest -OutFile ".env" -Uri "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$inboxId" -Headers @{"x-api-key" = $API_KEY}

# source the .env and connect using variables
Get-Content ".env" | ForEach-Object {
    $key, $value = $_ -split '=', 2
    Set-Item -Path "env:$key" -Value $value
}
#</gen>