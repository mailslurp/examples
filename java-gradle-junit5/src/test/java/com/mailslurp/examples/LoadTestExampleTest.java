package com.mailslurp.examples;


import static java.util.Collections.singletonList;
import static org.junit.jupiter.api.Assertions.*;

import com.mailslurp.apis.*;
import com.mailslurp.clients.*;
import com.mailslurp.models.*;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.function.BooleanSupplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * This example demonstrates how to use a MailSlurp inbox and plus addressing
 * to load test sending and receiving. An inbox has an address like test@mailslurp.com
 * A plus address is test+123@mailslurp.com. We use this idea in a load test to generate unique email
 * addresses and receive with a single inbox. Then we use a polling helper class to assert the inbox count expectation.
 * In this test we send from MailSlurp too using a simulated ExternalApplication but in your case you would instead
 * invoke your system or application to send emails to the generated inbox
 */
public class LoadTestExampleTest {
    private static final String YOUR_API_KEY = System.getenv("API_KEY");

    private static ApiClient defaultClient;
    private static UUID senderInboxId;

    // class to emulate an external application that will send emails
    // to our generated accounts
    public class ExternalApplication {
        ExternalApplication() {
        }

        void triggerEmailSendingToAddress(String address) throws ApiException {
            var options = new SendEmailOptions()
                    .to(List.of(address))
                    .subject("Load test email")
                    .body("Welcome " + address);
            System.out.println("Sending email to " + address);
            new InboxControllerApi(defaultClient).sendEmail(senderInboxId, options).execute();
        }
    }

    @BeforeAll
    public static void Setup() throws ApiException {
        assertNotNull(YOUR_API_KEY);
        var TIMEOUT_MILLIS = 120_000;
        defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setApiKey(YOUR_API_KEY);
        defaultClient.setConnectTimeout(TIMEOUT_MILLIS);
        defaultClient.setWriteTimeout(TIMEOUT_MILLIS);
        defaultClient.setReadTimeout(TIMEOUT_MILLIS);
        // sender inbox
        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults().execute();
        senderInboxId = inbox.getId();
    }


    @Test
    public void CanTestLoadTest() throws Exception {

        // create a base inbox for load test
        InboxControllerApi inboxControllerApi = new InboxControllerApi(defaultClient);
        InboxDto inbox = inboxControllerApi.createInboxWithDefaults().execute();

        // the parts of the email address local@domain
        // we will use these to generate email accounts with plus addressing like local+123@domain
        var localPart = inbox.getLocalPart();
        var domain = inbox.getDomain();

        var NUMBER_OF_EMAILS = 10; // set this to how many you need
        var externalApplication = new ExternalApplication();

        for (var i = 0; i < NUMBER_OF_EMAILS; i++) {
            // create a plus address using the base inbox so each email is unique
            var uniqueEmail = localPart + "+" + i + "@" + domain;

            // trigger an action in our external application to send email to the user
            externalApplication.triggerEmailSendingToAddress(uniqueEmail);
        }


        waitForCondition(() -> {
            Long count = null;
            try {
                count = inboxControllerApi.getInboxEmailCount(inbox.getId()).execute().getTotalElements();
            } catch (ApiException e) {
                throw new RuntimeException(e);
            }
            System.out.println("Found " + count + " email(s) in inbox with id: " + inbox.getId());
            return count == NUMBER_OF_EMAILS;
        }, Duration.of(120, ChronoUnit.SECONDS), Duration.of(3, ChronoUnit.SECONDS));

    }


    private void waitForCondition(
            BooleanSupplier condition,
            Duration timeout,
            Duration initialBackoff
    ) throws Exception {

        Instant deadline = Instant.now().plus(timeout);
        Duration backoff = initialBackoff;
        Exception lastException = null;

        while (Instant.now().isBefore(deadline)) {
            try {
                if (condition.getAsBoolean()) {
                    return; // success
                }
            } catch (Exception ex) {
                lastException = ex;
            }

            // sleep before retry
            Thread.sleep(backoff.toMillis());

            // exponential backoff (optional)
            backoff = backoff.multipliedBy(2);
        }

        // timeout reached
        if (lastException != null) {
            throw lastException;
        } else {
            throw new RuntimeException("Condition was not met before timeout expired.");
        }
    }

}
