# set API_KEY env variable to MailSlurp API Key
$apiKey = $Env:API_KEY
Write-Output "Running send script with key $apiKey"

# get inbox to send with
$inboxes = Invoke-WebRequest -Uri "https://api.mailslurp.com/inboxes" -Headers @{"x-api-key"=$apiKey;} | ConvertFrom-Json
$email = $inboxes[0].emailAddress
$inboxId = $inboxes[0].id

#<gen>ps1_windows_send_email_query
Invoke-WebRequest `
	-Uri "https://api.mailslurp.com/sendEmailQuery?to=$email&subject=test&body=Hello%20World" `
	-Method POST `
	-Headers @{"x-api-key"=$apiKey;}
#</gen>