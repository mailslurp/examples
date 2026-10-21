//<gen>inbox_docs_setup
package inboxdocs

import (
	"context"
	"crypto/tls"
	"errors"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/antihax/optional"
	imapclient "github.com/emersion/go-imap/client"
	mailslurp "github.com/mailslurp/mailslurp-client-go"
)

func NewClient() (*mailslurp.APIClient, context.Context, error) {
	apiKey := os.Getenv("MAILSLURP_API_KEY")
	if apiKey == "" {
		return nil, nil, errors.New("set MAILSLURP_API_KEY")
	}
	ctx := context.WithValue(context.Background(), mailslurp.ContextAPIKey, mailslurp.APIKey{Key: apiKey})
	config := mailslurp.NewConfiguration()
	config.HTTPClient = &http.Client{Timeout: 75 * time.Second}
	return mailslurp.NewAPIClient(config), ctx, nil
}

//</gen>

//<gen>inbox_docs_create_random
func CreateRandom(client *mailslurp.APIClient, ctx context.Context) (mailslurp.InboxDto, error) {
	name, tags := "Signup tests", []string{"signup", "staging"}
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{Name: &name, Tags: &tags})
	return inbox, err
}

//</gen>

//<gen>inbox_docs_create_pool
func CreatePool(client *mailslurp.APIClient, ctx context.Context) ([]mailslurp.DomainInformation, mailslurp.InboxDto, error) {
	available, _, err := client.DomainControllerApi.GetAvailableDomains(ctx, nil)
	if err != nil {
		return nil, mailslurp.InboxDto{}, err
	}
	var poolDomains []mailslurp.DomainInformation
	for _, group := range available.DomainGroups {
		if group.Label == "DOMAIN_POOL" {
			poolDomains = append(poolDomains, group.Domains...)
		}
	}
	usePool := true
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{UseDomainPool: &usePool})
	return poolDomains, inbox, err
}

//</gen>

//<gen>inbox_docs_create_custom
func CreateCustom(client *mailslurp.APIClient, ctx context.Context, verifiedAddress string) (mailslurp.InboxDto, error) {
	address, name := verifiedAddress, "Custom domain signup"
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{EmailAddress: &address, Name: &name})
	return inbox, err
}

//</gen>

//<gen>inbox_docs_create_virtual
func CreateVirtual(client *mailslurp.APIClient, ctx context.Context) (mailslurp.InboxDto, error) {
	name, virtual := "Application mail capture", true
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{Name: &name, VirtualInbox: &virtual})
	return inbox, err
}

//</gen>

//<gen>inbox_docs_create_expiring
func CreateExpiring(client *mailslurp.APIClient, ctx context.Context) (mailslurp.InboxDto, error) {
	name, expiresIn := "One test run", int64(5*60_000)
	inbox, _, err := client.InboxControllerApi.CreateInboxWithOptions(ctx, mailslurp.CreateInboxDto{Name: &name, ExpiresIn: &expiresIn})
	return inbox, err
}

//</gen>

//<gen>inbox_docs_catch_all
func CatchAll(client *mailslurp.APIClient, ctx context.Context, domainID string) (mailslurp.InboxDto, error) {
	if _, _, err := client.DomainControllerApi.AddDomainWildcardCatchAll(ctx, domainID); err != nil {
		return mailslurp.InboxDto{}, err
	}
	inbox, _, err := client.DomainControllerApi.GetDomainWildcardCatchAllInbox(ctx, domainID)
	return inbox, err
}

//</gen>

//<gen>inbox_docs_plus_address
func PlusAddress(client *mailslurp.APIClient, ctx context.Context, inbox mailslurp.InboxDto, label string) (mailslurp.PlusAddressDto, mailslurp.PageEmailPreview, error) {
	parts := strings.SplitN(inbox.EmailAddress, "@", 2)
	if len(parts) != 2 {
		return mailslurp.PlusAddressDto{}, mailslurp.PageEmailPreview{}, errors.New("invalid inbox email address")
	}
	plus, _, err := client.InboxControllerApi.GetOrCreateInboxPlusAddress(ctx, inbox.Id, parts[0]+"+"+label+"@"+parts[1])
	if err != nil {
		return plus, mailslurp.PageEmailPreview{}, err
	}
	emails, _, err := client.InboxControllerApi.GetInboxPlusAddressEmailsForPlusAddressId(ctx, plus.Id, inbox.Id,
		&mailslurp.GetInboxPlusAddressEmailsForPlusAddressIdOpts{Page: optional.NewInt32(0), Size: optional.NewInt32(20)})
	return plus, emails, err
}

//</gen>

//<gen>inbox_docs_send
func Send(client *mailslurp.APIClient, ctx context.Context, inboxID, recipient string) (mailslurp.SentEmailDto, error) {
	recipients := []string{recipient}
	subject, body, isHTML := "Welcome", "<p>Your account is ready.</p>", true
	sent, _, err := client.InboxControllerApi.SendEmailAndConfirm(ctx, inboxID, mailslurp.SendEmailOptions{
		To: &recipients, Subject: &subject, Body: &body, IsHTML: &isHTML,
	})
	return sent, err
}

//</gen>

//<gen>inbox_docs_list_inboxes
func ListInboxes(client *mailslurp.APIClient, ctx context.Context, tag string, page int32) (mailslurp.PageInboxProjection, error) {
	inboxes, _, err := client.InboxControllerApi.GetAllInboxes(ctx, &mailslurp.GetAllInboxesOpts{
		Tag: optional.NewString(tag), Page: optional.NewInt32(page), Size: optional.NewInt32(20), Sort: optional.NewString("DESC"),
	})
	return inboxes, err
}

//</gen>

//<gen>inbox_docs_list_emails
func ListEmails(client *mailslurp.APIClient, ctx context.Context, inboxID string, page int32) (mailslurp.PageEmailPreview, error) {
	emails, _, err := client.InboxControllerApi.GetInboxEmailsPaginated(ctx, inboxID, &mailslurp.GetInboxEmailsPaginatedOpts{
		Page: optional.NewInt32(page), Size: optional.NewInt32(20), Sort: optional.NewString("DESC"),
	})
	return emails, err
}

//</gen>

//<gen>inbox_docs_get_inbox
func GetInbox(client *mailslurp.APIClient, ctx context.Context, inboxID string) (mailslurp.InboxDto, error) {
	inbox, _, err := client.InboxControllerApi.GetInbox(ctx, inboxID)
	return inbox, err
}

//</gen>

//<gen>inbox_docs_get_email
func GetEmail(client *mailslurp.APIClient, ctx context.Context, emailID string) (mailslurp.Email, error) {
	email, _, err := client.EmailControllerApi.GetEmail(ctx, emailID)
	return email, err
}

//</gen>

//<gen>inbox_docs_delete_inbox
func DeleteInbox(client *mailslurp.APIClient, ctx context.Context, inboxID string) error {
	_, err := client.InboxControllerApi.DeleteInbox(ctx, inboxID)
	return err
}

//</gen>

//<gen>inbox_docs_webhook
func Webhook(client *mailslurp.APIClient, ctx context.Context, inboxID, receiverURL string) (mailslurp.WebhookDto, error) {
	event := "EMAIL_RECEIVED"
	webhook, _, err := client.WebhookControllerApi.CreateWebhook(ctx, inboxID, mailslurp.CreateWebhookOptions{Url: receiverURL, EventName: &event})
	return webhook, err
}

//</gen>

//<gen>inbox_docs_access
func Access(client *mailslurp.APIClient, ctx context.Context, inboxID string) (mailslurp.ImapSmtpAccessDetails, error) {
	details, _, err := client.InboxControllerApi.GetImapSmtpAccess(ctx, &mailslurp.GetImapSmtpAccessOpts{InboxId: optional.NewInterface(inboxID)})
	return details, err
}

//</gen>

//<gen>inbox_docs_wait_latest
func WaitLatest(client *mailslurp.APIClient, ctx context.Context, inboxID string, since time.Time) (mailslurp.Email, error) {
	email, _, err := client.WaitForControllerApi.WaitForLatestEmail(ctx, &mailslurp.WaitForLatestEmailOpts{
		InboxId: optional.NewInterface(inboxID), Timeout: optional.NewInt64(60_000), UnreadOnly: optional.NewBool(true), Since: optional.NewTime(since),
	})
	return email, err
}

//</gen>

//<gen>inbox_docs_wait_matching
func WaitMatching(client *mailslurp.APIClient, ctx context.Context, inboxID, subjectFragment, recipient string, since time.Time) (mailslurp.Email, error) {
	matches := []mailslurp.MatchOption{
		{Field: "SUBJECT", Should: "CONTAIN", Value: subjectFragment},
		{Field: "TO", Should: "CONTAIN", Value: recipient},
	}
	email, _, err := client.WaitForControllerApi.WaitForMatchingFirstEmail(ctx, inboxID, mailslurp.MatchOptions{Matches: &matches}, &mailslurp.WaitForMatchingFirstEmailOpts{
		Timeout: optional.NewInt64(60_000), UnreadOnly: optional.NewBool(true), Since: optional.NewTime(since),
	})
	return email, err
}

//</gen>

//<gen>inbox_docs_imap_tls
func ImapTLS(client *mailslurp.APIClient, ctx context.Context, inboxID string) (uint32, error) {
	details, _, err := client.InboxControllerApi.GetImapSmtpAccess(ctx, &mailslurp.GetImapSmtpAccessOpts{InboxId: optional.NewInterface(inboxID)})
	if err != nil {
		return 0, err
	}
	address := net.JoinHostPort(details.SecureImapServerHost, strconv.Itoa(int(details.SecureImapServerPort)))
	conn, err := imapclient.DialWithDialerTLS(&net.Dialer{Timeout: 30 * time.Second}, address, &tls.Config{
		ServerName: details.SecureImapServerHost, MinVersion: tls.VersionTLS12,
	})
	if err != nil {
		return 0, err
	}
	defer conn.Logout()
	conn.Timeout = 30 * time.Second
	if err := conn.Login(details.SecureImapUsername, details.SecureImapPassword); err != nil {
		return 0, err
	}
	mailbox, err := conn.Select(details.ImapMailbox, true)
	if err != nil {
		return 0, err
	}
	return mailbox.Messages, nil
}

//</gen>
