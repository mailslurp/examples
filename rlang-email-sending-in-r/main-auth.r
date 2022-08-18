#<gen>r_import_blastula
library(httr)
library(blastula)
#</gen>

print("Running rlang email")

#<gen>r_api_key
# check api key for mailslurp
api_key <- Sys.getenv("API_KEY", "")
if (!nchar(api_key)) {
  print("ERROR = Missing API_KEY")
  stop
}
#</gen>

#<gen>r_fetch_details
# make http request to mailslurp to obtain smtp access
print("Fetching smtp access details")
r <- GET("https://api.mailslurp.com/inboxes/imap-smtp-access", add_headers("x-api-key" = api_key))
status <- status_code(r)
access_details <- content(r)
if (status < 200 || status > 299) {
  print(paste("ERROR", "Get request to smtp access failed with status", status, "body", body))
  stop
}
#</gen>

#<gen>r_access_details
# extract smtp authentication details from response
host <- access_details$smtpServerHost
port <- access_details$smtpServerPort
username <- access_details$smtpUsername
password <- access_details$smtpPassword
#</gen>

#<gen>r_get_inbox
# get an inbox to send with
print("Fetching inbox details")
r <- GET("https://api.mailslurp.com/inboxes/paginated?page=0&size=1", add_headers("x-api-key" = api_key))
status <- status_code(r)
inbox_list <- content(r)
if (status < 200 || status > 299) {
  print(paste("ERROR", "Get request to inboxes failed with status", status, "body", body))
  stop
}
#</gen>

#<gen>r_list_email
email_address <- inbox_list$content[[1]]$emailAddress
address = paste("<", email_address, ">", sep="")
print (paste("Found email address:", address))
#</gen>


#<gen>r_compose_email
email <- compose_email(
  body = md(c("Test email"))
)
print (paste("Enter password when prompted", password))
smtp_send(
  email = email,
  from = email_address,
  to = email_address,
  credentials = creds(
    host = host,
    port = port,
    user = username
  )
)
#</gen>
