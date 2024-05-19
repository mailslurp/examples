package main

//<gen>golang_imap_import
import (
	"context"
	"fmt"
	"github.com/antihax/optional"
	"github.com/emersion/go-imap"
	imapClient "github.com/emersion/go-imap/client"
	mailslurp "github.com/mailslurp/mailslurp-client-go"
	"strconv"
)

//</gen>
import (
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"os"
	"testing"
)

var apiKey = os.Getenv("API_KEY")

func getMailSlurpClient(t *testing.T) (*mailslurp.APIClient, context.Context) {
	require.NotNil(t, apiKey)
	require.NotEqual(t, "", apiKey)
	ctx := context.WithValue(context.Background(), mailslurp.ContextAPIKey, mailslurp.APIKey{Key: apiKey})
	config := mailslurp.NewConfiguration()
	client := mailslurp.NewAPIClient(config)
	return client, ctx
}

func Test_CanConnectToMailbox(t *testing.T) {
	client, ctx := getMailSlurpClient(t)
	expiresIn := int64(300_000)
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{
		ExpiresIn: &expiresIn,
	})
	require.NoError(t, err)

	//<gen>golang_imap
	// get imap access details for an inbox
	details, _, err := client.InboxControllerApi.GetImapAccess(ctx, &mailslurp.GetImapAccessOpts{
		InboxId: optional.NewInterface(inbox.Id),
	})
	require.NoError(t, err)

	// connect to server
	addr := fmt.Sprint(details.ImapServerHost + ":" + strconv.Itoa(int(details.ImapServerPort)))
	c, err := imapClient.Dial(addr)
	require.NoError(t, err)

	// login
	err = c.Login(details.ImapUsername, details.ImapPassword)
	require.NoError(t, err)
	//</gen>

	//<gen>golang_imap_list
	// list mailboxes
	mailboxes := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		done <- c.List("", "*", mailboxes)
	}()
	var mboxes []string
	for m := range mailboxes {
		mboxes = append(mboxes, m.Name)
	}
	if err := <-done; err != nil {
		require.NoError(t, err)
	}
	assert.Len(t, mboxes, 2)
	assert.Contains(t, mboxes, "INBOX")
	assert.Contains(t, mboxes, inbox.EmailAddress)

	// can select INBOX
	_, err = c.Select(inbox.EmailAddress, false)
	require.NoError(t, err)

	// search messages
	resSeqs, err := c.Search(&imap.SearchCriteria{
		WithoutFlags: []string{"\\Seen"},
	})
	require.NoError(t, err)
	fmt.Println("Search result imap seq nums", resSeqs)

	// logout
	err = c.Logout()
	require.NoError(t, err)
	//</gen>
}
