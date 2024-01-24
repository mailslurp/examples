package com.mailslurp.examples;

import com.mailslurp.apis.EmailControllerApi;
import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.apis.WaitForControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.*;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.remote.CapabilityType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.Assert.*;

public class MoreMethodsTest {

    // get a MailSlurp API Key free at https://app.mailslurp.com
    private static final String YOUR_API_KEY = System.getenv("API_KEY");
    private static final Long TIMEOUT_MILLIS = 30000L;

    private static ApiClient mailslurpClient;
    private Logger logger = LoggerFactory.getLogger(this.getClass());

    @BeforeClass
    public static void beforeAll() {
        assertNotNull(YOUR_API_KEY);
        // setup mailslurp
        mailslurpClient = Configuration.getDefaultApiClient();
        mailslurpClient.setApiKey(YOUR_API_KEY);
        mailslurpClient.setConnectTimeout(TIMEOUT_MILLIS.intValue());
    }

    @Test
    public void canCreateInboxAndFetch() throws ApiException {
        InboxControllerApi inboxControllerApi = new InboxControllerApi(mailslurpClient);
        //<gen>java_create_inbox_with_tags_and_names
        // use names, description, and tags to identify an inbox
        String randomString = String.valueOf(new Random().nextLong());
        String customName = "Test inbox " + randomString;
        String customDescription = "My custom description " + randomString;
        String customTag = "test-inbox-" + randomString;
        // create inbox with options so we can find it later
        CreateInboxDto options = new CreateInboxDto()
                .name(customName)
                .description(customDescription)
                .tags(Collections.singletonList(customTag));
        InboxDto inbox = inboxControllerApi.createInboxWithOptions(options);
        //</gen>
        assertEquals(inbox.getName(), customName);
        assertEquals(inbox.getDescription(), customDescription);
        assertEquals(Objects.requireNonNull(inbox.getTags()).get(0), customTag);
        //<gen>java_fetch_inbox_by_name
        InboxByNameResult inboxByName = inboxControllerApi.getInboxByName(customName);
        assertEquals(inboxByName.getInboxId(), inbox.getId());
        //</gen>
        //<gen>java_fetch_inbox_by_tags
        PageInboxProjection inboxSearchResult = inboxControllerApi.searchInboxes(
                new SearchInboxesOptions()
                        .search(customTag)
        );
        assertEquals(inboxSearchResult.getNumberOfElements(), Integer.valueOf(1));
        assertEquals(inboxSearchResult.getContent().get(0).getId(), inbox.getId());
        //</gen>
        String mySubject = "Test subject " + randomString;
        inboxControllerApi.sendEmailAndConfirm(inbox.getId(), new SendEmailOptions()
                .to(Collections.singletonList(inbox.getEmailAddress()))
                .subject(mySubject)
        );
        //<gen>java_fetch_email_by_match
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(mailslurpClient);
        List<EmailPreview> matchingEmails = waitForControllerApi.waitFor(new WaitForConditions()
                .inboxId(inbox.getId())
                .timeout(120000L)
                .count(1)
                .countType(WaitForConditions.CountTypeEnum.ATLEAST)
                .unreadOnly(true)
                .addMatchesItem(new MatchOption()
                        .field(MatchOption.FieldEnum.SUBJECT)
                        .should(MatchOption.ShouldEnum.CONTAIN)
                        .value("Test subject")
                )

        );
        //</gen>
        assertEquals(matchingEmails.size(), 1);
        assertEquals(Objects.requireNonNull(matchingEmails).get(0).getFrom(), inbox.getEmailAddress());
        //<gen>java_fetch_email_by_search
        EmailControllerApi emailController = new EmailControllerApi(mailslurpClient);
        PageEmailProjection emailSearch = emailController.searchEmails(
                new SearchEmailsOptions()
                        .searchFilter("Test subject")
        );
        //</gen>
        assertEquals(emailSearch.getNumberOfElements(), Integer.valueOf(1));
        assertEquals(Objects.requireNonNull(emailSearch.getContent()).get(0).getFrom(), inbox.getEmailAddress());
    }
}
