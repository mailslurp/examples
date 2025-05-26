package com.mailslurp.clienttest;

import java.time.Instant;
import java.util.Collections;

import com.mailslurp.api.api.CommonActionsControllerApi;
import com.mailslurp.api.api.WaitForControllerApi;
import com.mailslurp.client.ApiClient;
import com.mailslurp.client.ApiException;
import com.mailslurp.client.Configuration;
import com.mailslurp.client.auth.ApiKeyAuth;
import com.mailslurp.models.Email;
import com.mailslurp.models.Inbox;
import com.mailslurp.models.SendEmailOptions;
import com.mailslurp.models.SimpleSendEmailOptions;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
public class SDKTest {

    @Test(timeout = 60000)
    public void contextLoads() throws ApiException {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        defaultClient.setConnectTimeout(60000);
        ApiKeyAuth API_KEY = (ApiKeyAuth) defaultClient.getAuthentication("API_KEY");
        API_KEY.setApiKey("test");

        // create an email address
        CommonActionsControllerApi apiInstance = new CommonActionsControllerApi();
        WaitForControllerApi waitInstance = new WaitForControllerApi();
        Inbox inbox = apiInstance.createNewEmailAddress();
        assertThat(inbox.getId()).isNotNull();
        assertThat(inbox.getEmailAddress()).contains("mailslurp.com");

        // send email to self
        SimpleSendEmailOptions sendOptions = new SimpleSendEmailOptions();
        sendOptions.setTo(inbox.getEmailAddress());
        String body = "test-body-" + Instant.now().toEpochMilli();
        sendOptions.setBody(body);
        apiInstance.sendEmailSimple(sendOptions);

        Email email = waitInstance.waitForLatestEmail(inbox.getId(), 60000L, true);
        assertThat(email.getBody()).contains(body);
    }

}
