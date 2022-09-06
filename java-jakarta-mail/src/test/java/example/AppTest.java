package example;

import static org.junit.Assert.assertTrue;

import com.mailslurp.apis.ApiUserControllerApi;
import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.ImapSmtpAccessDetails;
import com.mailslurp.models.InboxDto;
import com.mailslurp.models.InboxPreview;
import com.mailslurp.models.PageInboxProjection;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import org.junit.Before;
import org.junit.Test;

import java.util.Properties;
import java.util.UUID;

/**
 * Unit test to demonstrate email sending using Jakarta Mail
 */
public class AppTest {


    private String host;
    private int port;
    private String username;
    private String password;
    private String emailAddress;
    private UUID inboxId;

    //<gen>jakarta_test_before
    @Before
    public void beforeTest() throws ApiException {
        // configure a mailslurp client using an API_KEY set environment variable
        String apiKey = System.getenv("API_KEY");
        if (apiKey == null || apiKey.length() == 0) {
            throw new RuntimeException("API_KEY environment variable must be set");
        }
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(apiKey);
        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);

        // get an smtp inbox belonging to our mailslurp account
        PageInboxProjection inboxes = inboxControllerApi.getAllInboxes(0, 1, null, null, null, null, null, null, null, InboxDto.InboxTypeEnum.SMTP_INBOX.toString(), null);
        InboxPreview inbox = inboxes.getContent().get(0);
        this.emailAddress = inbox.getEmailAddress();
        this.inboxId = inbox.getId();

        // get smtp access details for our mailslurp smtp mailserver
        ImapSmtpAccessDetails imapSmtpAccess = inboxControllerApi.getImapSmtpAccess(null);
        this.host = imapSmtpAccess.getSmtpServerHost();
        this.port = imapSmtpAccess.getSmtpServerPort();
        this.username = imapSmtpAccess.getSmtpUsername();
        this.password = imapSmtpAccess.getSmtpPassword();
    }
    //</gen>

    @Test
    public void canSendAnEmailWithJakarta() {
        //<gen>jakarta_test_configure
        // configure smtp mailserver properties
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "false");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);
        //</gen>

        //<gen>jakarta_test_session
        // create an authentication session
        Session session = Session.getInstance(props,
                new jakarta.mail.Authenticator() {
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(username, password);
                    }
                });
        //</gen>
    }
}
