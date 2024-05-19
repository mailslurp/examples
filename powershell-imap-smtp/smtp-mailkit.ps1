#!/usr/bin/env pwsh
. .\_helpers.ps1
$scriptPath = Split-Path -Path $script:MyInvocation.MyCommand.Definition -Parent
$apiKey = $env:API_KEY

Load-EnvironmentVariables -filePath ".\.env.inbox"
LoadMailKit($scriptPath)

# assert $env:SMTP_USERNAME and $env:SMTP_PASSWORD are set
if (-not $env:SMTP_USERNAME -or -not $env:SMTP_PASSWORD) {
    Write-Host "Please set SMTP_USERNAME and SMTP_PASSWORD environment variables."
    exit 1
}

# Create a new SMTP inbox and parse JSON response
$response = Invoke-RestMethod -Method Post -Uri "https://api.mailslurp.com/inboxes?inboxType=SMTP_INBOX" -Headers @{ "x-api-key" = $apiKey }
$inboxId = $response.id
$emailAddress = $response.emailAddress

# Set up email parameters
$emailAddress = $emailAddress
$senderAddress = $emailAddress
$recipientName = "Recipient"
$senderName = "Sender name"
$subject = "Test Email from PowerShell"
$body = "This is a test email sent from PowerShell using MailKit/MimeKit."

#<gen>pswh_mailkit_smtp_message
# Create a new MimeMessage
$message = New-Object MimeKit.MimeMessage

# Add sender and recipient
$message.From.Add([MimeKit.MailboxAddress]::new($senderName, $senderAddress))
$message.To.Add([MimeKit.MailboxAddress]::new($recipientName, $emailAddress))

# Set the subject and body
$message.Subject = $subject
$message.Body = [MimeKit.TextPart]::new("plain")
$message.Body.Text = $body
#</gen>

#<gen>pswh_mailkit_smtp_send
# Connect to the SMTP server
$smtpClient = New-Object MailKit.Net.Smtp.SmtpClient
$smtpClient.Connect("mxslurp.click", 2525)

# If authentication is required, provide credentials
$smtpClient.Authenticate([System.Text.Encoding]::UTF8, $env:SMTP_USERNAME, $env:SMTP_PASSWORD)

# Send the message
$smtpClient.Send($message)
$smtpClient.Disconnect($true)
#</gen>