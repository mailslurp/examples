package com.mailslurp.examples.config;

import com.mailslurp.api.api.CommonOperationsApi;
import com.mailslurp.client.ApiClient;
import com.mailslurp.client.Configuration;
import com.mailslurp.client.auth.ApiKeyAuth;

public class MailSlurpConfig {

    public CommonOperationsApi getClient(String apiKey) {
        // configure MailSlurp http client
        ApiClient defaultClient = Configuration
                .getDefaultApiClient()
                .setConnectTimeout(60000);

        // set MailSlurp API Key
        ((ApiKeyAuth) defaultClient.getAuthentication("API_KEY")).setApiKey(apiKey);

        // create instance of common API operations
        return new CommonOperationsApi(defaultClient);
    }
}
