package com.mailslurp.examples;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.CreateInboxDto;
import com.mailslurp.models.InboxDto;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class EmailOtpMatchFlowTest {

    private static final String OTP_PATTERN = "Your confirmation code is \"(\\w+)\"\\.";

    private static String apiKey;
    private static String mailslurpBaseUrl;
    private static String testEndpointsBaseUrl;
    private static String password;
    private static String subjectMatch;
    private static long waitTimeoutMs;

    @BeforeClass
    public static void beforeAll() {
        apiKey = firstNonBlank(System.getenv("MAILSLURP_API_KEY"), System.getenv("API_KEY"));
        mailslurpBaseUrl = trimTrailingSlash(envOrDefault("MAILSLURP_BASE_URL", "https://api.mailslurp.com"));
        testEndpointsBaseUrl = trimTrailingSlash(envOrDefault("TEST_ENDPOINTS_BASE_URL", mailslurpBaseUrl));
        password = envOrDefault("TEST_PASSWORD", "TestPass123!");
        subjectMatch = envOrDefault("SUBJECT_MATCH", "Please confirm your email address");
        waitTimeoutMs = Long.parseLong(envOrDefault("WAIT_TIMEOUT_MS", "120000"));

        assertNotNull("MAILSLURP_API_KEY (or API_KEY) must be set", apiKey);
        assertTrue("MAILSLURP_API_KEY (or API_KEY) must not be blank", apiKey.trim().length() > 0);
    }

    @Test
    public void emailOtpFlowUsingSubjectMatchAndContentExtraction() throws Exception {
        ApiClient mailSlurpClient = Configuration.getDefaultApiClient();
        mailSlurpClient.setApiKey(apiKey);
        mailSlurpClient.setBasePath(mailslurpBaseUrl);

        InboxControllerApi inboxControllerApi = new InboxControllerApi(mailSlurpClient);
        UUID inboxId = null;

        try {
            InboxDto inbox = inboxControllerApi
                .createInboxWithOptions(new CreateInboxDto().expiresIn(300000L))
                .execute();
            inboxId = inbox.getId();
            String emailAddress = inbox.getEmailAddress();

            assertNotNull("inboxId should be created", inboxId);
            assertNotNull("emailAddress should be created", emailAddress);

            // 1) Submit signup to test application endpoint.
            HttpResult signUpResponse = postForm(
                testEndpointsBaseUrl + "/test-endpoints/sign-up",
                formMap("emailAddress", emailAddress, "password", password)
            );
            assertEquals("signup response status", 200, signUpResponse.statusCode);
            assertTrue("signup response should mention confirmation code", signUpResponse.body.contains("Confirmation code sent to"));
            assertTrue("signup response should mention confirm endpoint", signUpResponse.body.contains("/confirm?code="));

            // 2) Wait for matching subject email in created inbox.
            String waitForMatchingUrl = mailslurpBaseUrl
                + "/waitForMatchingEmails?inboxId=" + urlEncode(inboxId.toString())
                + "&count=1&timeout=" + waitTimeoutMs
                + "&unreadOnly=true";
            String waitForMatchingBody =
                "{\"matches\":[{\"field\":\"SUBJECT\",\"should\":\"CONTAIN\",\"value\":\""
                    + escapeJson(subjectMatch)
                    + "\"}]}";

            HttpResult waitResponse = postJson(waitForMatchingUrl, waitForMatchingBody, apiKey);
            assertEquals("waitForMatchingEmails status", 200, waitResponse.statusCode);

            JsonArray emails = JsonParser.parseString(waitResponse.body).getAsJsonArray();
            assertTrue("waitForMatchingEmails should return at least one email", emails.size() > 0);

            JsonObject firstEmail = emails.get(0).getAsJsonObject();
            String emailId = firstEmail.get("id").getAsString();
            String returnedSubject = firstEmail.has("subject") && !firstEmail.get("subject").isJsonNull()
                ? firstEmail.get("subject").getAsString()
                : "";
            assertTrue("subject should contain expected match", returnedSubject.contains(subjectMatch));

            // 3) Extract OTP code using contentMatch endpoint.
            String contentMatchUrl = mailslurpBaseUrl + "/emails/" + urlEncode(emailId) + "/contentMatch";
            String contentMatchBody = "{\"pattern\":\"" + escapeJson(OTP_PATTERN) + "\"}";
            HttpResult contentMatchResponse = postJson(contentMatchUrl, contentMatchBody, apiKey);
            assertEquals("contentMatch status", 200, contentMatchResponse.statusCode);

            JsonObject contentMatchJson = JsonParser.parseString(contentMatchResponse.body).getAsJsonObject();
            JsonArray matches = contentMatchJson.getAsJsonArray("matches");
            assertNotNull("contentMatch matches should be present", matches);
            assertTrue("contentMatch should include capture group value", matches.size() > 1);
            String confirmationCode = matches.get(1).getAsString();
            assertTrue("confirmation code should not be blank", confirmationCode.trim().length() > 0);

            // 4) Confirm signup with extracted code.
            HttpResult confirmResponse = postForm(
                testEndpointsBaseUrl + "/test-endpoints/confirm",
                formMap("emailAddress", emailAddress, "code", confirmationCode)
            );
            assertEquals("confirm response status", 200, confirmResponse.statusCode);
            assertTrue("confirm response should indicate success", confirmResponse.body.contains("User confirmed"));

            // 5) Login and verify flow completion.
            HttpResult loginResponse = postForm(
                testEndpointsBaseUrl + "/test-endpoints/login",
                formMap("emailAddress", emailAddress, "password", password)
            );
            assertEquals("login response status", 200, loginResponse.statusCode);
            assertTrue("login response should indicate success", loginResponse.body.contains("Login successful"));
        } finally {
            if (inboxId != null) {
                try {
                    inboxControllerApi.deleteInbox(inboxId).execute();
                } catch (Exception ignored) {
                    // Cleanup should not hide test assertion failures.
                }
            }
        }
    }

    private static HttpResult postForm(String url, Map<String, String> formValues) throws IOException {
        String body = toFormBody(formValues);
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Content-Type", "application/x-www-form-urlencoded");
        return doPost(url, body, headers);
    }

    private static HttpResult postJson(String url, String jsonBody, String apiKey) throws IOException {
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Content-Type", "application/json");
        headers.put("x-api-key", apiKey);
        return doPost(url, jsonBody, headers);
    }

    private static HttpResult doPost(String url, String body, Map<String, String> headers) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(30000);
        connection.setReadTimeout(30000);
        connection.setDoOutput(true);

        for (Map.Entry<String, String> header : headers.entrySet()) {
            connection.setRequestProperty(header.getKey(), header.getValue());
        }

        byte[] payload = body.getBytes("UTF-8");
        connection.setRequestProperty("Content-Length", String.valueOf(payload.length));
        OutputStream outputStream = connection.getOutputStream();
        try {
            outputStream.write(payload);
        } finally {
            outputStream.close();
        }

        int statusCode = connection.getResponseCode();
        InputStream stream = statusCode >= 400 ? connection.getErrorStream() : connection.getInputStream();
        String responseBody = readStream(stream);
        connection.disconnect();

        return new HttpResult(statusCode, responseBody);
    }

    private static String readStream(InputStream stream) throws IOException {
        if (stream == null) {
            return "";
        }
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream, "UTF-8"));
        StringBuilder builder = new StringBuilder();
        try {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        } finally {
            reader.close();
        }
        return builder.toString();
    }

    private static String toFormBody(Map<String, String> values) throws IOException {
        StringBuilder body = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            if (!first) {
                body.append("&");
            }
            body.append(urlEncode(entry.getKey())).append("=").append(urlEncode(entry.getValue()));
            first = false;
        }
        return body.toString();
    }

    private static String urlEncode(String value) throws IOException {
        return URLEncoder.encode(value, "UTF-8");
    }

    private static Map<String, String> formMap(String k1, String v1, String k2, String v2) {
        Map<String, String> map = new HashMap<String, String>();
        map.put(k1, v1);
        map.put(k2, v2);
        return map;
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }

    private static String envOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.trim().isEmpty()) {
            return a;
        }
        if (b != null && !b.trim().isEmpty()) {
            return b;
        }
        return null;
    }

    private static final class HttpResult {
        private final int statusCode;
        private final String body;

        private HttpResult(int statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }
    }
}

