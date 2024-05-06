$API_KEY = $env:API_KEY
$response = Invoke-RestMethod -Uri "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -Method Post -Headers @{"x-api-key" = $API_KEY}
$inboxId = $response.id
#<gen>ps1_access_mailbox
# download access details for an inbox as .env file
Set-Location $PSScriptRoot
Invoke-WebRequest -OutFile ".env" -Uri "https://api.mailslurp.com/inboxes/imap-smtp-access/env?inboxId=$inboxId" -Headers @{"x-api-key" = $API_KEY}

# source the .env and connect using variables
Get-Content ".env" | ForEach-Object {
    $keyValue = $_.Split('=', 2)
    if ($keyValue.Count -eq 2)
    {
        $envName = $keyValue[0].Trim()
        $envValue = $keyValue[1].Trim()
        # Remove leading and trailing double quotes from the value
        if ($envValue.StartsWith('"') -and $envValue.EndsWith('"'))
        {
            $envValue = $envValue.Substring(1, $envValue.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($envName, $envValue, [System.EnvironmentVariableTarget]::Process)
    }
}
#</gen>
if (-not (Test-Path env:IMAP_SERVER_HOST)) {
    throw "Environment variable IMAP_SERVER_HOST does not exist"
}