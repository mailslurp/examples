if [ -z "$API_KEY" ]
then
  echo "Please set the API_KEY environment variable."
  exit 1
fi

curl -sLo .env "https://api.mailslurp.com/inboxes/imap-smtp-access/env?apiKey=$API_KEY"