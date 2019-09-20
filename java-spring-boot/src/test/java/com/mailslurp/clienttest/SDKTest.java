package com.mailslurp.clienttest;

import java.time.Instant;
import java.util.Collections;
import mailslurp.ApiClient;
import mailslurp.ApiException;
import mailslurp.Configuration;
import mailslurp.auth.ApiKeyAuth;
import mailslurpapi.CommonOperationsApi;
import mailslurpmodels.Email;
import mailslurpmodels.Inbox;
import mailslurpmodels.SendEmailOptions;
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
        CommonOperationsApi apiInstance = new CommonOperationsApi();
        Inbox inbox = apiInstance.createNewEmailAddressUsingPOST();
        assertThat(inbox.getId()).isNotNull();
        assertThat(inbox.getEmailAddress()).contains("mailslurp.com");

        // send email to self
        SendEmailOptions sendOptions = new SendEmailOptions();
        sendOptions.setTo(Collections.singletonList(inbox.getEmailAddress()));
        String body = "test-body-" + Instant.now().toEpochMilli();
        sendOptions.setBody(body);
        apiInstance.sendEmailSimpleUsingPOST(sendOptions);

        Email email = apiInstance.fetchLatestEmailUsingGET(inbox.getEmailAddress(), null);
        assertThat(email.getBody()).contains(body);
    }

}
