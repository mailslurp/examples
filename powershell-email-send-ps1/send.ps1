# set API_KEY env variable to MailSlurp API Key
$apiKey = $Env:API_KEY
Write-Output "Running send script with key $apiKey"

# get inbox to send with
$inboxes = Invoke-WebRequest -Uri "https://api.mailslurp.com/inboxes" -Headers @{"x-api-key"=$apiKey;} | ConvertFrom-Json
$email = $inboxes[0].emailAddress
$inboxId = $inboxes[0].id

# Send the email
$params = @{
 "to"=@($email);
 "subject"="Testing 123";
 "body"="Hello";
}
$status = Invoke-WebRequest `
	-Uri "https://api.mailslurp.com/inboxes/$inboxId" `
	-Method POST `
	-Body ($params|ConvertTo-Json) `
	-ContentType "application/json" `
	-Headers @{"x-api-key"=$apiKey;} | Select-Object -Expand StatusCode

Write-Output "Email sent with status $status"