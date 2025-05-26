package com.mailslurp.clienttest;

import java.util.Collections;

import com.mailslurp.client.ApiClient;
import com.mailslurp.client.ApiException;
import com.mailslurp.client.Configuration;
import com.mailslurp.client.auth.ApiKeyAuth;
import com.mailslurp.models.SendEmailOptions;
import com.mailslurp.api.api.CommonActionsControllerApi;
import com.mailslurp.models.SimpleSendEmailOptions;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public void sendEmail(String to, String body) throws ApiException {
        ApiClient client = Configuration.getDefaultApiClient();
        client.setConnectTimeout(60000);
        ApiKeyAuth API_KEY = (ApiKeyAuth) client.getAuthentication("API_KEY");
        API_KEY.setApiKey("test");
        CommonActionsControllerApi apiInstance = new CommonActionsControllerApi();
        SimpleSendEmailOptions options = new SimpleSendEmailOptions();
        options.setBody(body);
        options.setTo(to);
        apiInstance.sendEmailSimple(options);
    }
}
