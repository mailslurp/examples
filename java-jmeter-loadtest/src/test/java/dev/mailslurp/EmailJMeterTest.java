package dev.mailslurp;

import com.mailslurp.apis.*;
import com.mailslurp.clients.*;
import com.mailslurp.models.Email;
import com.mailslurp.models.InboxDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import java.util.concurrent.TimeUnit;
import us.abstracta.jmeter.javadsl.core.TestPlanStats;

import java.util.UUID;

import static us.abstracta.jmeter.javadsl.JmeterDsl.*;

/**
 * Unit test for simple App.
 */
public class EmailJMeterTest {
    @Test
    @Timeout(value = 2, unit = TimeUnit.MINUTES)
    void magicLinkFlow() throws Exception {

        String apiKey = System.getenv("API_KEY");
        ApiClient client = Configuration.getDefaultApiClient();
        client.setApiKey(apiKey);
        // Increase HTTP timeouts for MailSlurp API calls (milliseconds)
        client.setConnectTimeout(60000);
        client.setReadTimeout(60000);
        client.setWriteTimeout(60000);

        InboxControllerApi inboxApi = new InboxControllerApi(client);
        WaitForControllerApi waitApi = new WaitForControllerApi(client);

        TestPlanStats stats = testPlan(
                threadGroup(1, 1,
                        jsr223Sampler(ctx -> {
                            InboxDto inbox = inboxApi.createInboxWithDefaults().execute();
                            ctx.vars.put("INBOX_ID", inbox.getId().toString());
                            ctx.vars.put("EMAIL_ADDRESS", inbox.getEmailAddress());
                        }),
                        jsr223Sampler(ctx -> {
                            String emailAddr = ctx.vars.get("EMAIL_ADDRESS");
                            if (emailAddr == null || emailAddr.isEmpty()) {
                                throw new AssertionError("EMAIL_ADDRESS was not set");
                            }
                        }),
                        httpSampler("https://api.mailslurp.com/test-application/magic-link")
                                .method("POST")
                                .header("Content-Type", "application/x-www-form-urlencoded")
                                .body("emailAddress=${EMAIL_ADDRESS}")
                                ,
                        jsr223Sampler(ctx -> {
                            String inboxIdStr = ctx.vars.get("INBOX_ID");
                            if (inboxIdStr == null) {
                                throw new AssertionError("INBOX_ID was not set");
                            }
                            UUID inboxId = UUID.fromString(inboxIdStr);
                            Email email = waitApi.waitForLatestEmail()
                                    .inboxId(inboxId)
                                    .timeout(60_000L)
                                    .unreadOnly(true).execute();
                            if (email.getSubject() == null) throw new AssertionError("No subject!");
                        })
                )
        ).run();

        // Fail JUnit if any sampler failed
        if (stats.overall().sampleTimePercentile99() == null) {
            throw new AssertionError("Test did not complete");
        }
    }
}
