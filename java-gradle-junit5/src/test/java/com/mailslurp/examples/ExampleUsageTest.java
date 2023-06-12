package com.mailslurp.examples;


//<gen>java_demo_imports
import com.mailslurp.apis.*;
import com.mailslurp.clients.*;
import com.mailslurp.models.*;
//</gen>
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static java.util.Collections.singletonList;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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
        assertEquals(inbox.getEmailAddress().contains("@mailslurp.com"), true);
        assertNotNull(inbox.getId());
        //</gen>
    }

    @Test
    public void CanSendEmails() throws Exception {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults();

        SendEmailOptions sendEmailOptions = new SendEmailOptions()
                .to(singletonList(inbox.getEmailAddress()))
                .subject("Test")
                .body("Hello");
        inboxControllerApi.sendEmail(inbox.getId(), sendEmailOptions);
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

        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(defaultClient);
        Email email = waitForControllerApi.waitForLatestEmailW(inbox2.getId(), TIMEOUT_MILLIS.longValue(), UNREAD_ONLY);

        assertEquals(email.getSubject(), "Hello inbox2");
        assertEquals(email.getBody().contains("Your code is:"), true);

        Pattern p = Pattern.compile("Your code is: ([0-9]{3})");
        Matcher m = p.matcher(email.getBody());
        m.find();

        String code =  m.group(1);
        assertEquals(code, "123");
    }
}
