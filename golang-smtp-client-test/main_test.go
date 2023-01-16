package main

import (
	"context"
	"github.com/antihax/optional"
	sasl "github.com/emersion/go-sasl"
	smtp "github.com/emersion/go-smtp"
	mailslurp "github.com/mailslurp/mailslurp-client-go"
	"github.com/stretchr/testify/assert"
	"log"
	"os"
	"strings"
	"testing"
)

var apiKey = os.Getenv("API_KEY")

func getMailSlurpClient(t *testing.T) (*mailslurp.APIClient, context.Context) {
	assert.NotNil(t, apiKey)

	// create a context with your api key
	ctx := context.WithValue(context.Background(), mailslurp.ContextAPIKey, mailslurp.APIKey{Key: apiKey})

	// create mailslurp client
	config := mailslurp.NewConfiguration()
	client := mailslurp.NewAPIClient(config)

	return client, ctx
}

// how to send insecurely with mailslurp
func Test_CanSendEmail_Insecure(t *testing.T) {
	// create a context with your api key
	client, ctx := getMailSlurpClient(t)

	// create an inbox using the inbox controller
	opts := &mailslurp.CreateInboxOpts{
		InboxType: optional.NewString("SMTP_INBOX"),
	}

	// create two inboxes for testing
	inbox1, _, _ := client.InboxControllerApi.CreateInbox(ctx, opts)
	smtpAccess, _, _ := client.InboxControllerApi.GetImapSmtpAccess(ctx, &mailslurp.GetImapSmtpAccessOpts{
		InboxId: optional.NewInterface(inbox1.Id),
	})
	inbox2, _, _ := client.InboxControllerApi.CreateInbox(ctx, opts)
	auth := sasl.NewPlainClient("", smtpAccess.SmtpUsername, smtpAccess.SmtpPassword)

	// send email from inbox1 to inbox2
	c, err := smtp.Dial("mx.mailslurp.com:2525")
	if err != nil {
		assert.NoError(t, err, "Expect client dial")
	}
	defer c.Close()

	log.Println("Say hello")
	err = c.Hello("test")
	assert.NoError(t, err, "Expect hello")
	log.Println("Set auth")
	err = c.Auth(auth)
	assert.NoError(t, err, "Expect auth")

	log.Println("Send email")
	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step.
	to := []string{inbox2.EmailAddress}
	msg := strings.NewReader("To: " + inbox2.EmailAddress + "\r\n" +
		"Subject: Hello Insecure Gophers!\r\n" +
		"\r\n" +
		"This is the email body.\r\n")
	err = c.SendMail(inbox1.EmailAddress, to, msg)
	assert.NoError(t, err, "Expect insecure smtp send to work")

	log.Println("Wait for email to arrive")
	// fetch the email for inbox2
	waitOpts := &mailslurp.WaitForLatestEmailOpts{
		InboxId:    optional.NewInterface(inbox2.Id),
		Timeout:    optional.NewInt64(30000),
		UnreadOnly: optional.NewBool(true),
	}
	email, _, err := client.WaitForControllerApi.WaitForLatestEmail(ctx, waitOpts)
	log.Println("Email received: " + *email.Subject)
	assert.NoError(t, err)
	assert.Contains(t, *email.Subject, "Hello Insecure Gophers")
	assert.Contains(t, *email.Body, "This is the email body")
}

// TODO work in progress
func Test_CanSendEmail_TLS(t *testing.T) {
	// create a context with your api key
	client, ctx := getMailSlurpClient(t)

	// create an inbox using the inbox controller
	opts := &mailslurp.CreateInboxOpts{
		InboxType: optional.NewString("SMTP_INBOX"),
	}

	// create two inboxes for testing
	inbox1, _, _ := client.InboxControllerApi.CreateInbox(ctx, opts)
	smtpAccess, _, _ := client.InboxControllerApi.GetImapSmtpAccess(ctx, &mailslurp.GetImapSmtpAccessOpts{
		InboxId: optional.NewInterface(inbox1.Id),
	})
	inbox2, _, _ := client.InboxControllerApi.CreateInbox(ctx, opts)

	// send email from inbox1 to inbox2
	auth := sasl.NewPlainClient("", smtpAccess.SmtpUsername, smtpAccess.SmtpPassword)

	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step.
	to := []string{inbox2.EmailAddress}
	msg := strings.NewReader("To: " + inbox2.EmailAddress + "\r\n" +
		"Subject: Hello Gophers!\r\n" +
		"\r\n" +
		"This is the email body.\r\n")
	err := smtp.SendMail("mx.mailslurp.com:2587", auth, inbox1.EmailAddress, to, msg)
	if err != nil {
		log.Fatal(err)
		assert.NoError(t, err, "Expect smtp send to work")
	}

	// fetch the email for inbox2
	waitOpts := &mailslurp.WaitForLatestEmailOpts{
		InboxId:    optional.NewInterface(inbox2.Id),
		Timeout:    optional.NewInt64(30000),
		UnreadOnly: optional.NewBool(true),
	}
	email, _, err := client.WaitForControllerApi.WaitForLatestEmail(ctx, waitOpts)
	assert.NoError(t, err)
	assert.Contains(t, *email.Subject, "Hello Gophers")
	assert.Contains(t, *email.Body, "This is the email body")
}
