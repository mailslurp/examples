package com.mailslurp.examples;

import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.apis.WaitForControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.Email;
import com.mailslurp.models.InboxDto;
import com.mailslurp.models.SendEmailOptions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.BeforeClass;
import org.junit.Test;

import static java.util.Collections.singletonList;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

public class ExampleUsageTest {

    private final static String YOUR_API_KEY = System.getenv("API_KEY");
    private static final Boolean UNREAD_ONLY = true;
    private static final Long TIMEOUT_MILLIS = 30000L;

    @BeforeClass
    public static void Setup() {
        assertNotNull(YOUR_API_KEY);
    }

    @Test
    public void CanCreateInboxes() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInbox().execute();

        // verify inbox
        assertEquals(inbox.getEmailAddress().contains("@mailslurp.com"), true);
        assertNotNull(inbox.getId());
    }

    @Test
    public void CanSendEmails() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInbox().execute();

        SendEmailOptions sendEmailOptions = new SendEmailOptions()
                .to(singletonList(inbox.getEmailAddress()))
                .subject("Test")
                .body("Hello");
        inboxControllerApi.sendEmail(inbox.getId(), sendEmailOptions).execute();
    }

    @Test
    public void CanReceiveEmail() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox1 = inboxControllerApi.createInbox().execute();
        InboxDto inbox2 = inboxControllerApi.createInbox().execute();

        SendEmailOptions sendEmailOptions = new SendEmailOptions()
                .to(singletonList(inbox2.getEmailAddress()))
                .subject("Hello inbox2")
                .body("Your code is: 123");
        inboxControllerApi.sendEmail(inbox1.getId(), sendEmailOptions);

        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(defaultClient);
        Email email = waitForControllerApi.waitForLatestEmail().inboxId(inbox2.getId()).timeout(TIMEOUT_MILLIS).unreadOnly(UNREAD_ONLY).execute();

        assertEquals(email.getSubject(), "Hello inbox2");
        assertEquals(email.getBody().contains("Your code is:"), true);

        Pattern p = Pattern.compile("Your code is: ([0-9]{3})");
        Matcher m = p.matcher(email.getBody());
        m.find();

        String code = m.group(1);
        assertEquals(code, "123");
    }
}
