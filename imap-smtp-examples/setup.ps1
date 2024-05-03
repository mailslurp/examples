if ([string]::IsNullOrEmpty($env:API_KEY)) {
    Write-Host "Please set the API_KEY environment variable."
    exit 1
}

Invoke-WebRequest -Uri "https://api.mailslurp.com/inboxes/imap-smtp-access/env?apiKey=$env:API_KEY" -OutFile ".env"