package com.mailslurp.examples;

import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.Configuration;
import okhttp3.OkHttpClient;

import java.util.concurrent.TimeUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.notNullValue;

public class MailSlurpClient {

    // set your MailSlurp API KEY via environment variable
    private static final String apiKey = System.getenv("API_KEY");
    // set a timeout so we can wait for emails to arrive
    public static final Long TIMEOUT = 30000L;
    private final ApiClient apiClient;

    public MailSlurpClient() {
        assertThat(apiKey, notNullValue());

        // create a MailSlurp client and http client
        OkHttpClient httpClient = new OkHttpClient.Builder()
                .connectTimeout(TIMEOUT, TimeUnit.MILLISECONDS)
                .writeTimeout(TIMEOUT, TimeUnit.MILLISECONDS)
                .readTimeout(TIMEOUT, TimeUnit.MILLISECONDS)
                .build();

        apiClient = Configuration.getDefaultApiClient();

        // IMPORTANT set api client timeouts
        apiClient.setConnectTimeout(TIMEOUT.intValue());
        apiClient.setWriteTimeout(TIMEOUT.intValue());
        apiClient.setReadTimeout(TIMEOUT.intValue());

        // IMPORTANT set API KEY and client
        apiClient.setHttpClient(httpClient);
        apiClient.setApiKey(apiKey);
    }

    public ApiClient getClient() {
        return apiClient;
    }
}
