package com.mailslurp.clienttest;

import java.util.Collections;
import mailslurp.ApiClient;
import mailslurp.ApiException;
import mailslurp.Configuration;
import mailslurp.auth.ApiKeyAuth;
import mailslurpapi.CommonOperationsApi;
import mailslurpmodels.SendEmailOptions;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendEmail(String to, String body) throws ApiException {
        ApiClient client = Configuration.getDefaultApiClient();
        client.setConnectTimeout(60000);
        ApiKeyAuth API_KEY = (ApiKeyAuth) client.getAuthentication("API_KEY");
        API_KEY.setApiKey("test");
        CommonOperationsApi apiInstance = new CommonOperationsApi();
        SendEmailOptions options = new SendEmailOptions();
        options.setBody(body);
        options.setTo(Collections.singletonList(to));
        apiInstance.sendEmailSimpleUsingPOST(options);
    }
}
