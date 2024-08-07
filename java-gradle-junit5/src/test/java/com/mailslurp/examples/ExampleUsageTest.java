package com.mailslurp.examples;


//<gen>java_demo_imports

import com.mailslurp.apis.*;
import com.mailslurp.clients.*;
import com.mailslurp.models.*;
//</gen>
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static java.util.Collections.singletonList;
import static org.junit.jupiter.api.Assertions.*;

public class ExampleUsageTest {
    private final static String YOUR_API_KEY = System.getenv("API_KEY");
    private static final Boolean UNREAD_ONLY = true;
    //    private static final Long TIMEOUT_MILLIS = 30000L;
    private static final Integer TIMEOUT_MILLIS = 30000;

    @BeforeAll
    public static void Setup() {
        assertNotNull(YOUR_API_KEY);
    }

    @Test
    public void CanUseSecureEndpoint() throws Exception {
        //<gen>java_demo_create_secure
        ApiClient secureClient = Configuration.getDefaultApiClient();
        secureClient.setApiKey(YOUR_API_KEY);
        secureClient.setBasePath("https://secure-api.mailslurp.com");
        secureClient.setConnectTimeout(TIMEOUT_MILLIS.intValue());
        InboxControllerApi inboxControllerApi = new InboxControllerApi(secureClient);
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults();
        //</gen>
        assertNotNull(inbox.getId());
    }

    @Test
    public void CanCreateInboxes() throws Exception {

        //<gen>java_demo_create_client
        // create a MailSlurp client with your API_KEY
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);
        //</gen>

        //<gen>java_demo_client_timeout
        defaultClient.setConnectTimeout(TIMEOUT_MILLIS);
        defaultClient.setWriteTimeout(TIMEOUT_MILLIS);
        defaultClient.setReadTimeout(TIMEOUT_MILLIS);
        //</gen>

        //<gen>java_demo_create_controller
        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        //</gen>

        //<gen>java_demo_create_inbox
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults();
        // verify inbox
        assertEquals(inbox.getEmailAddress().contains("@mailslurp"), true);
        assertNotNull(inbox.getId());
        //</gen>
        //<gen>java_demo_create_inbox_options
        CreateInboxDto options = new CreateInboxDto()
                .description("My inbox")
                .inboxType(CreateInboxDto.InboxTypeEnum.SMTP_INBOX);
        InboxDto inboxWithOptions = inboxControllerApi.createInboxWithOptions(options);
        //</gen>
        assertNotNull(inboxWithOptions.getId());

        //<gen>java_demo_get_inbox
        // get inbox by id
        InboxDto inboxById = inboxControllerApi.getInbox(inbox.getId());

        // lookup inbox by address
        InboxByEmailAddressResult inboxByAddress = inboxControllerApi.getInboxByEmailAddress(inbox.getEmailAddress());
        assertEquals(inboxByAddress.getInboxId(), inbox.getId());

        // lookup inbox by name
        InboxByNameResult inboxByName = inboxControllerApi.getInboxByName("Non-existing inbox");
        assertFalse(inboxByName.getExists());
        //</gen>

        //<gen>java_demo_list_inboxes
        PageInboxProjection allInboxes = inboxControllerApi.getAllInboxes(0, 10, null, null, null, null, null, null, null, null, null);
        // can access pagination
        assertTrue(allInboxes.getTotalElements() > 0);
        assertEquals(allInboxes.getPageable().getPageNumber().intValue(), 0);
        assertEquals(allInboxes.getPageable().getPageSize().intValue(), 10);
        // can access inboxes
        InboxPreview inboxPreview = allInboxes.getContent().get(0);
        //</gen>
        assertNotNull(inboxPreview.getCreatedAt());
    }

    @Test
    public void CanSendEmails() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults();
        InboxDto inbox2 = inboxControllerApi.createInboxWithDefaults();

        //<gen>java_demo_send_email
        SendEmailOptions sendEmailOptions = new SendEmailOptions()
                .to(singletonList(inbox.getEmailAddress()))
                .subject("Test")
                .body("Hello");
        inboxControllerApi.sendEmail(inbox.getId(), sendEmailOptions);
        //</gen>

        //<gen>java_demo_upload_attachment
        byte[] bytes = {0}; // test file, in reality read a file or input stream as bytes;
        UploadAttachmentOptions uploadAttachmentOptions = new UploadAttachmentOptions()
                .contentType("text/plain")
                .filename("hello.txt")
                .base64Contents(Base64.getEncoder().encodeToString(bytes));

        AttachmentControllerApi attachmentControllerApi = new AttachmentControllerApi(defaultClient);
        List<String> attachmentIds = attachmentControllerApi.uploadAttachment(uploadAttachmentOptions);
        //</gen>
        //<gen>java_demo_send_attachment
        SendEmailOptions sendOptions = new SendEmailOptions()
                .to(singletonList(inbox2.getEmailAddress()))
                .subject("Test email")
                .body("Hello with attachment")
                .attachments(attachmentIds);
        inboxControllerApi.sendEmail(inbox2.getId(), sendOptions);
        //</gen>
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(defaultClient);
        Email email = waitForControllerApi.waitForLatestEmail(inbox2.getId(), TIMEOUT_MILLIS.longValue(), UNREAD_ONLY, null, null, null, null);

        //<gen>java_demo_download_attachments
        String attachmentId = email.getAttachments().get(0);
        // get attachment file name etc
        AttachmentMetaData attachmentInfo = attachmentControllerApi.getAttachmentInfo(attachmentId);
        assertNotNull(attachmentInfo.getName());
        // download as bytes
        byte[] attachmentBytes = attachmentControllerApi.downloadAttachmentAsBytes(attachmentId);
        //</gen>
        assertNotNull(attachmentBytes);
    }

    @Test
    public void CanReceiveEmail() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox1 = inboxControllerApi.createInboxWithDefaults();
        InboxDto inbox2 = inboxControllerApi.createInboxWithDefaults();

        SendEmailOptions sendEmailOptions = new SendEmailOptions()
                .to(singletonList(inbox2.getEmailAddress()))
                .subject("Hello inbox2")
                .body("Your code is: 123");
        inboxControllerApi.sendEmail(inbox1.getId(), sendEmailOptions);

        //<gen>java_demo_wait_for_email
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(defaultClient);
        Email email = waitForControllerApi.waitForLatestEmail(inbox2.getId(), TIMEOUT_MILLIS.longValue(), UNREAD_ONLY, null, null, null, null);

        assertEquals(email.getSubject(), "Hello inbox2");
        assertEquals(email.getBody().contains("Your code is:"), true);
        //</gen>

        //<gen>java_demo_wait_for_matching_email
        Pattern p = Pattern.compile("Your code is: ([0-9]{3})");
        Matcher m = p.matcher(email.getBody());
        m.find();

        String code = m.group(1);
        assertEquals(code, "123");
        //</gen>

        //<gen>java_demo_matching
        inboxControllerApi.sendEmail(inbox1.getId(), new SendEmailOptions()
                .to(singletonList(inbox1.getEmailAddress()))
                .subject("Verification code")
                .body("Your code is: 456"));
        // complex match option
        List<EmailPreview> verificationEmail = waitForControllerApi.waitFor(new WaitForConditions()
                .inboxId(inbox1.getId())
                .unreadOnly(true)
                .countType(WaitForConditions.CountTypeEnum.EXACTLY)
                .count(1)
                .addMatchesItem(new MatchOption()
                        .field(MatchOption.FieldEnum.FROM)
                        .should(MatchOption.ShouldEnum.EQUAL)
                        .value(inbox1.getEmailAddress()))
                .addMatchesItem(new MatchOption()
                        .field(MatchOption.FieldEnum.SUBJECT)
                        .should(MatchOption.ShouldEnum.CONTAIN)
                        .value("Verification code")));
        assertEquals(verificationEmail.size(), 1);
        //</gen>

        InboxDto inbox3 = inboxControllerApi.createInboxWithDefaults();
        //<gen>java_demo_extract
        inboxControllerApi.sendEmail(inbox1.getId(), new SendEmailOptions()
                .to(singletonList(inbox3.getEmailAddress()))
                .subject("HTML notification")
                .body("<div><p>Use xpath selectors to <em class='needle'>find</em> content.</p></div>"));
        Email emailWithHtml = waitForControllerApi.waitForLatestEmail(inbox3.getId(), TIMEOUT_MILLIS.longValue(), UNREAD_ONLY, null, null, null, null);
        // extract content from email body
        EmailTextLinesResult emailHTMLQuery = new EmailControllerApi(defaultClient).getEmailHTMLQuery(emailWithHtml.getId(), ".needle");
        assertEquals(emailHTMLQuery.getLines().get(0), "find");
        //</gen>
    }
}
