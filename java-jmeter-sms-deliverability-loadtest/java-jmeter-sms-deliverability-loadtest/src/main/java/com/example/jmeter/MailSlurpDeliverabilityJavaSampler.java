package com.example.jmeter;

import com.mailslurp.apis.PhoneControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.clients.ApiResponse;
import com.mailslurp.models.PagePhoneNumberProjection;
import com.mailslurp.models.PhoneNumberProjection;
import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.protocol.java.sampler.AbstractJavaSamplerClient;
import org.apache.jmeter.protocol.java.sampler.JavaSamplerContext;
import org.apache.jmeter.samplers.SampleResult;
import org.apache.jmeter.threads.JMeterContextService;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * JMeter Java sampler that executes the full MailSlurp SMS deliverability workflow using
 * mailslurp-client-java for phone selection plus ApiClient raw calls for deliverability endpoints.
 */
public class MailSlurpDeliverabilityJavaSampler extends AbstractJavaSamplerClient {

    private static final Type MAP_TYPE = Map.class;
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
            .withZone(ZoneOffset.UTC);

    private static final Set<String> DONE_STATES = Set.of("COMPLETE", "COMPLETED", "SUCCESS", "SUCCEEDED", "FINISHED", "PASS", "PASSED");
    private static final Set<String> FAIL_STATES = Set.of("FAILED", "ERROR", "CANCELLED", "TIMEOUT", "TIMED_OUT");

    @Override
    public Arguments getDefaultParameters() {
        Arguments args = new Arguments();
        args.addArgument("apiProtocol", "https");
        args.addArgument("apiHost", "api.mailslurp.com");
        args.addArgument("apiPort", "443");
        args.addArgument("apiBasePath", "");
        args.addArgument("apiKey", "");
        args.addArgument("runType", "ALL");
        args.addArgument("sendMode", "SIMULATOR");
        args.addArgument("phoneListPageSize", "20");
        args.addArgument("deliverabilityScope", "PHONE");
        args.addArgument("testMaxDurationSeconds", "1200");
        args.addArgument("expectedMinCount", "1");
        args.addArgument("simulationDelayMs", "250");
        args.addArgument("simulationBatchSize", "10");
        args.addArgument("simulationSendsPerTarget", "1");
        args.addArgument("pollIntervalMillis", "15000");
        args.addArgument("pollTimeoutMillis", "1200000");
        return args;
    }

    @Override
    public SampleResult runTest(JavaSamplerContext context) {
        SampleResult result = new SampleResult();
        result.setSampleLabel("MailSlurp Java SDK Deliverability Workflow");
        result.sampleStart();

        try {
            Config cfg = Config.from(context);
            ApiClient apiClient = buildApiClient(cfg);
            PhoneControllerApi phoneApi = new PhoneControllerApi(apiClient);

            Selection selection = selectPhones(phoneApi, cfg);
            Map<String, Object> createdTest = createDeliverabilityTest(apiClient, cfg, selection);

            UUID testId = parseRequiredUuid(createdTest.get("id"), "deliverabilityTestId");
            putVar("deliverabilityTestId", testId.toString());
            System.out.println("JMETER_JAVA_SETUP deliverabilityTestId=" + testId);

            invokeNoContent(apiClient, "POST", "/test/deliverability/" + testId + "/start", null);

            if (cfg.sendMode.equals("SIMULATOR")) {
                Map<String, Object> createdJob = createSimulationJob(apiClient, cfg, selection, testId);
                UUID simulationJobId = parseRequiredUuid(createdJob.get("id"), "simulationJobId");
                putVar("simulationJobId", simulationJobId.toString());
                System.out.println("JMETER_JAVA_SETUP simulationJobId=" + simulationJobId);
            } else {
                putVar("simulationJobId", "");
                System.out.println("JMETER_JAVA_SETUP sendMode=EXTERNAL (simulation skipped; trigger your SUT externally now)");
            }

            PollOutcome outcome = pollStatus(apiClient, cfg, selection, testId);
            String summary = outcome.summary;

            if (outcome.success) {
                result.setSuccessful(true);
                result.setResponseCode("200");
                result.setResponseMessage("Deliverability test succeeded");
                result.setResponseData(summary, StandardCharsets.UTF_8.name());
            } else {
                result.setSuccessful(false);
                result.setResponseCode(outcome.timeout ? "504" : "500");
                result.setResponseMessage(outcome.timeout ? "Deliverability test timed out" : "Deliverability test failed");
                result.setResponseData(summary, StandardCharsets.UTF_8.name());
            }

            System.out.println("JMETER_JAVA_FINAL " + summary);
            return result;
        } catch (ApiException apiException) {
            String body = apiException.getResponseBody() == null ? "" : apiException.getResponseBody();
            String msg = "MailSlurp API error code=" + apiException.getCode() + " message=" + apiException.getMessage();
            result.setSuccessful(false);
            result.setResponseCode(String.valueOf(apiException.getCode() > 0 ? apiException.getCode() : 500));
            result.setResponseMessage(msg);
            result.setResponseData((msg + "\n" + body), StandardCharsets.UTF_8.name());
            System.out.println("JMETER_JAVA_ERROR " + msg + " body=" + body);
            return result;
        } catch (Exception e) {
            String msg = "Unexpected sampler error: " + e.getMessage();
            result.setSuccessful(false);
            result.setResponseCode("500");
            result.setResponseMessage(msg);
            result.setResponseData(msg, StandardCharsets.UTF_8.name());
            System.out.println("JMETER_JAVA_ERROR " + msg);
            return result;
        } finally {
            result.sampleEnd();
        }
    }

    private Selection selectPhones(PhoneControllerApi phoneApi, Config cfg) throws ApiException {
        PagePhoneNumberProjection page = phoneApi.getPhoneNumbers()
                .page(0)
                .size(cfg.phoneListPageSize)
                .sort("ASC")
                .execute();

        List<PhoneNumberProjection> phones = page == null || page.getContent() == null
                ? Collections.emptyList()
                : page.getContent();

        if (phones.isEmpty()) {
            throw new IllegalStateException("No phone numbers found for this account");
        }

        PhoneNumberProjection simulation = phones.get(0);
        UUID simulationId = Objects.requireNonNull(simulation.getId(), "simulationPhoneId missing");
        String simulationNumber = simulation.getPhoneNumber();

        putVar("simulationPhoneId", simulationId.toString());
        putVar("simulationPhoneNumber", simulationNumber == null ? "" : simulationNumber);

        if ("SINGLE".equals(cfg.runType)) {
            if (phones.size() < 2) {
                throw new IllegalStateException("SINGLE mode requires at least 2 phone numbers");
            }
            PhoneNumberProjection target = phones.get(1);
            UUID targetId = Objects.requireNonNull(target.getId(), "targetPhoneId missing");
            if (targetId.equals(simulationId)) {
                throw new IllegalStateException("Target phone id equals simulation phone id in SINGLE mode");
            }
            putVar("targetPhoneId", targetId.toString());
            putVar("targetPhoneNumber", target.getPhoneNumber() == null ? "" : target.getPhoneNumber());
            System.out.println("JMETER_JAVA_SETUP phoneCount=" + phones.size() + " runType=SINGLE simulationPhoneId=" + simulationId + " targetPhoneId=" + targetId);
            return new Selection(simulationId, simulationNumber, targetId);
        }

        putVar("targetPhoneId", "");
        putVar("targetPhoneNumber", "");
        System.out.println("JMETER_JAVA_SETUP phoneCount=" + phones.size() + " runType=ALL simulationPhoneId=" + simulationId);
        return new Selection(simulationId, simulationNumber, null);
    }

    private Map<String, Object> createDeliverabilityTest(ApiClient apiClient, Config cfg, Selection selection) throws ApiException {
        Map<String, Object> selector = new LinkedHashMap<>();
        if ("SINGLE".equals(cfg.runType)) {
            selector.put("type", "EXPLICIT");
            selector.put("entityIds", List.of(selection.targetPhoneId.toString()));
            // Some providers can route sender -> same recipient. Exclude sender to keep signal clean.
            selector.put("excludeEntityIds", List.of(selection.simulationPhoneId.toString()));
        } else {
            selector.put("type", "ALL");
            selector.put("excludeEntityIds", List.of(selection.simulationPhoneId.toString()));
        }

        Map<String, Object> expectation = new LinkedHashMap<>();
        expectation.put("name", "At least one SMS from the simulation sender");
        expectation.put("minCount", cfg.expectedMinCount);
        expectation.put("from", selection.simulationPhoneNumber);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", "jmeter-java-sdk-sms-deliverability-" + TS_FORMAT.format(Instant.now()));
        payload.put("description", "JMeter Java SDK deliverability run (" + cfg.runType + ")");
        payload.put("scope", cfg.deliverabilityScope);
        payload.put("maxDurationSeconds", cfg.testMaxDurationSeconds);
        payload.put("selector", selector);
        payload.put("expectations", List.of(expectation));

        System.out.println("JMETER_JAVA_SETUP createDeliverabilityRequest=" + payload);
        return invokeJson(apiClient, "POST", "/test/deliverability", payload);
    }

    private Map<String, Object> createSimulationJob(ApiClient apiClient, Config cfg, Selection selection, UUID testId) throws ApiException {
        Map<String, Object> sms = new LinkedHashMap<>();
        sms.put("bodyTemplate", "MailSlurp Java SDK deliverability simulation send {{sendIndex}} attempt {{attempt}} to {{targetLabel}}");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("senderPhoneId", selection.simulationPhoneId.toString());
        payload.put("sms", sms);
        payload.put("delayMs", cfg.simulationDelayMs);
        payload.put("batchSize", cfg.simulationBatchSize);
        payload.put("sendsPerTarget", cfg.simulationSendsPerTarget);

        return invokeJson(apiClient, "POST", "/test/deliverability/" + testId + "/simulation-jobs", payload);
    }

    private PollOutcome pollStatus(ApiClient apiClient, Config cfg, Selection selection, UUID testId) throws ApiException, InterruptedException {
        long started = System.currentTimeMillis();

        while (System.currentTimeMillis() - started < cfg.pollTimeoutMillis) {
            Map<String, Object> statusResponse = invokeJson(apiClient, "GET", "/test/deliverability/" + testId + "/status", null);
            Map<String, Object> testNode = asMap(statusResponse.get("test"));
            if (testNode == null) {
                testNode = statusResponse;
            }

            String status = firstNonBlank(
                    asString(testNode.get("status")),
                    asString(testNode.get("state")),
                    "UNKNOWN"
            );
            double progress = asDouble(
                    firstNonNull(testNode.get("completionPercentage"), testNode.get("progressPercent"), testNode.get("progress")),
                    0.0
            );
            int matched = asInt(testNode.get("matchedEntities"), 0);
            int total = asInt(testNode.get("totalEntities"), 0);
            boolean timedOut = asBoolean(testNode.get("timedOut"), false);
            String failureReason = asString(testNode.get("failureReason"));

            putVar("deliverabilityTestStatus", status);
            putVar("deliverabilityTestProgress", String.valueOf(progress));
            putVar("deliverabilityMatchedEntities", String.valueOf(matched));
            putVar("deliverabilityTotalEntities", String.valueOf(total));
            putVar("deliverabilityTimedOut", String.valueOf(timedOut));
            putVar("deliverabilityFailureReason", failureReason == null ? "" : failureReason);

            long elapsedMs = System.currentTimeMillis() - started;
            String progressMsg = "status=" + status + " progress=" + progress + " matched=" + matched + "/" + total + " elapsedMs=" + elapsedMs;
            System.out.println("JMETER_JAVA_PROGRESS " + progressMsg);

            String normalized = status.toUpperCase(Locale.ROOT);
            String summary = "runType=" + cfg.runType
                    + " sendMode=" + cfg.sendMode
                    + " status=" + status
                    + " progress=" + progress
                    + " matched=" + matched + "/" + total
                    + " simulationPhoneId=" + selection.simulationPhoneId
                    + " targetPhoneId=" + (selection.targetPhoneId == null ? "" : selection.targetPhoneId)
                    + " timedOut=" + timedOut
                    + " failureReason=" + (failureReason == null ? "" : failureReason)
                    + " timeoutMs=" + cfg.pollTimeoutMillis;

            if (DONE_STATES.contains(normalized)) {
                return new PollOutcome(true, false, summary);
            }
            if (FAIL_STATES.contains(normalized) || timedOut) {
                return new PollOutcome(false, false, summary);
            }

            Thread.sleep(cfg.pollIntervalMillis);
        }

        String timeoutSummary = "runType=" + cfg.runType
                + " sendMode=" + cfg.sendMode
                + " status=TIMEOUT"
                + " simulationPhoneId=" + selection.simulationPhoneId
                + " targetPhoneId=" + (selection.targetPhoneId == null ? "" : selection.targetPhoneId)
                + " timeoutMs=" + cfg.pollTimeoutMillis;
        return new PollOutcome(false, true, timeoutSummary);
    }

    private ApiClient buildApiClient(Config cfg) {
        StringBuilder basePath = new StringBuilder();
        basePath.append(cfg.apiProtocol).append("://").append(cfg.apiHost);

        boolean appendPort = !("https".equalsIgnoreCase(cfg.apiProtocol) && cfg.apiPort == 443)
                && !("http".equalsIgnoreCase(cfg.apiProtocol) && cfg.apiPort == 80);
        if (appendPort) {
            basePath.append(':').append(cfg.apiPort);
        }

        if (cfg.apiBasePath != null && !cfg.apiBasePath.isBlank()) {
            if (!cfg.apiBasePath.startsWith("/")) {
                basePath.append('/');
            }
            basePath.append(cfg.apiBasePath);
        }

        ApiClient apiClient = new ApiClient();
        apiClient.setBasePath(basePath.toString());
        apiClient.addDefaultHeader("x-api-key", cfg.apiKey);
        apiClient.addDefaultHeader("accept", "application/json");
        apiClient.addDefaultHeader("content-type", "application/json");
        apiClient.setReadTimeout(60_000);
        apiClient.setConnectTimeout(15_000);
        return apiClient;
    }

    private Map<String, Object> invokeJson(ApiClient apiClient, String method, String path, Object body) throws ApiException {
        ApiResponse<Map<String, Object>> response = apiClient.execute(
                apiClient.buildCall(
                        apiClient.getBasePath(),
                        path,
                        method,
                        new ArrayList<>(),
                        new ArrayList<>(),
                        body,
                        new LinkedHashMap<>(),
                        new LinkedHashMap<>(),
                        new LinkedHashMap<>(),
                        new String[0],
                        null
                ),
                MAP_TYPE
        );
        return response.getData() == null ? Collections.emptyMap() : response.getData();
    }

    private void invokeNoContent(ApiClient apiClient, String method, String path, Object body) throws ApiException {
        apiClient.execute(
                apiClient.buildCall(
                        apiClient.getBasePath(),
                        path,
                        method,
                        new ArrayList<>(),
                        new ArrayList<>(),
                        body,
                        new LinkedHashMap<>(),
                        new LinkedHashMap<>(),
                        new LinkedHashMap<>(),
                        new String[0],
                        null
                )
        );
    }

    private static UUID parseRequiredUuid(Object value, String fieldName) {
        String raw = asString(value);
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(fieldName + " missing from API response");
        }
        return UUID.fromString(raw);
    }

    private static String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private static int asInt(Object value, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }

    private static double asDouble(Object value, double defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }

    private static boolean asBoolean(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    private static Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static void putVar(String key, String value) {
        if (JMeterContextService.getContext() != null && JMeterContextService.getContext().getVariables() != null) {
            JMeterContextService.getContext().getVariables().put(key, value == null ? "" : value);
        }
    }

    private static final class Selection {
        private final UUID simulationPhoneId;
        private final String simulationPhoneNumber;
        private final UUID targetPhoneId;

        private Selection(UUID simulationPhoneId, String simulationPhoneNumber, UUID targetPhoneId) {
            this.simulationPhoneId = simulationPhoneId;
            this.simulationPhoneNumber = simulationPhoneNumber;
            this.targetPhoneId = targetPhoneId;
        }
    }

    private static final class PollOutcome {
        private final boolean success;
        private final boolean timeout;
        private final String summary;

        private PollOutcome(boolean success, boolean timeout, String summary) {
            this.success = success;
            this.timeout = timeout;
            this.summary = summary;
        }
    }

    private static final class Config {
        private final String apiProtocol;
        private final String apiHost;
        private final int apiPort;
        private final String apiBasePath;
        private final String apiKey;
        private final String runType;
        private final String sendMode;
        private final int phoneListPageSize;
        private final String deliverabilityScope;
        private final long testMaxDurationSeconds;
        private final int expectedMinCount;
        private final int simulationDelayMs;
        private final int simulationBatchSize;
        private final int simulationSendsPerTarget;
        private final long pollIntervalMillis;
        private final long pollTimeoutMillis;

        private Config(String apiProtocol,
                       String apiHost,
                       int apiPort,
                       String apiBasePath,
                       String apiKey,
                       String runType,
                       String sendMode,
                       int phoneListPageSize,
                       String deliverabilityScope,
                       long testMaxDurationSeconds,
                       int expectedMinCount,
                       int simulationDelayMs,
                       int simulationBatchSize,
                       int simulationSendsPerTarget,
                       long pollIntervalMillis,
                       long pollTimeoutMillis) {
            this.apiProtocol = apiProtocol;
            this.apiHost = apiHost;
            this.apiPort = apiPort;
            this.apiBasePath = apiBasePath;
            this.apiKey = apiKey;
            this.runType = runType;
            this.sendMode = sendMode;
            this.phoneListPageSize = phoneListPageSize;
            this.deliverabilityScope = deliverabilityScope;
            this.testMaxDurationSeconds = testMaxDurationSeconds;
            this.expectedMinCount = expectedMinCount;
            this.simulationDelayMs = simulationDelayMs;
            this.simulationBatchSize = simulationBatchSize;
            this.simulationSendsPerTarget = simulationSendsPerTarget;
            this.pollIntervalMillis = pollIntervalMillis;
            this.pollTimeoutMillis = pollTimeoutMillis;
        }

        private static Config from(JavaSamplerContext context) {
            String apiProtocol = readString(context, "apiProtocol", "https");
            String apiHost = readString(context, "apiHost", "api.mailslurp.com");
            int apiPort = readInt(context, "apiPort", 443);
            String apiBasePath = readString(context, "apiBasePath", "");
            String apiKey = readString(context, "apiKey", "");

            if (apiKey.isBlank()) {
                throw new IllegalArgumentException("Missing apiKey parameter. Set API_KEY env var or pass -JapiKey=...");
            }

            String runType = readString(context, "runType", "ALL").toUpperCase(Locale.ROOT);
            if (!runType.equals("ALL") && !runType.equals("SINGLE")) {
                throw new IllegalArgumentException("Invalid runType='" + runType + "'. Allowed values: ALL or SINGLE.");
            }

            String sendMode = readString(context, "sendMode", "SIMULATOR").toUpperCase(Locale.ROOT);
            if (!sendMode.equals("SIMULATOR") && !sendMode.equals("EXTERNAL")) {
                throw new IllegalArgumentException("Invalid sendMode='" + sendMode + "'. Allowed values: SIMULATOR or EXTERNAL.");
            }

            return new Config(
                    apiProtocol,
                    apiHost,
                    apiPort,
                    apiBasePath,
                    apiKey,
                    runType,
                    sendMode,
                    readInt(context, "phoneListPageSize", 20),
                    readString(context, "deliverabilityScope", "PHONE"),
                    readLong(context, "testMaxDurationSeconds", 1200),
                    readInt(context, "expectedMinCount", 1),
                    readInt(context, "simulationDelayMs", 250),
                    readInt(context, "simulationBatchSize", 10),
                    readInt(context, "simulationSendsPerTarget", 1),
                    readLong(context, "pollIntervalMillis", 15_000),
                    readLong(context, "pollTimeoutMillis", 1_200_000)
            );
        }

        private static String readString(JavaSamplerContext context, String key, String defaultValue) {
            String value = context.getParameter(key, defaultValue);
            return value == null ? defaultValue : value.trim();
        }

        private static int readInt(JavaSamplerContext context, String key, int defaultValue) {
            String raw = readString(context, key, String.valueOf(defaultValue));
            return Integer.parseInt(raw);
        }

        private static long readLong(JavaSamplerContext context, String key, long defaultValue) {
            String raw = readString(context, key, String.valueOf(defaultValue));
            return Long.parseLong(raw);
        }
    }
}
