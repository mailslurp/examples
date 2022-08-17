#<gen>r_import
library(httr)
library(sendmailR)
#</gen>

print("Running rlang email")

# check api key for mailslurp
api_key <- Sys.getenv("API_KEY", "")
if (!nchar(api_key)) {
  print("ERROR = Missing API_KEY")
  stop
}

# make http request to mailslurp to obtain smtp access
print("Fetching smtp access details")
r <- GET("https://api.mailslurp.com/inboxes/imap-smtp-access", add_headers("x-api-key" = api_key))
status <- status_code(r)
access_details <- content(r)
if (status < 200 || status > 299) {
  print(paste("ERROR", "Get request to smtp access failed with status", status, "body", body))
  stop
}

# extract smtp authentication details from response
host <- access_details$smtpServerHost
port <- access_details$smtpServerPort
username <- access_details$smtpUsername
password <- access_details$smtpPassword

# get an inbox to send with
print("Fetching inbox details")
r <- GET("https://api.mailslurp.com/inboxes/paginated?page=0&size=1", add_headers("x-api-key" = api_key))
status <- status_code(r)
inbox_list <- content(r)
if (status < 200 || status > 299) {
  print(paste("ERROR", "Get request to inboxes failed with status", status, "body", body))
  stop
}

email_address <- inbox_list$content[[1]]$emailAddress
address = paste("<", email_address, ">", sep="")
print (paste("Found email address:", address))


# Now send an email to the address
from <- "<my@sender.com>" 
to <- address
subject <- "Send email with R!"
body <- "Wow, R can do everything."
sendmail(from,to,subject,body,control=list(smtpServer=host,smtpPort=port))

