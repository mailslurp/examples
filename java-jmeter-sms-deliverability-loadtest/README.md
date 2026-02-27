# MailSlurp SMS Deliverability + Simulation in JMeter

This project is a runnable reference for QA/SRE/load-test teams who want to validate SMS delivery at scale using MailSlurp deliverability tests.

It includes **two JMeter approaches**:

1. **HTTP Sampler approach** (classic JMeter style): explicit REST calls and JSON extractors.
2. **Java Request approach** (JMeter pro style): Java sampler using `mailslurp-client-java:17.1.0` + API client calls.

Both approaches support:

- `runType=ALL`
- `runType=SINGLE`
- `sendMode=SIMULATOR|EXTERNAL`
- poll every 15s
- 20-minute poll timeout by default

## What This Example Does

End-to-end flow:

1. Read `API_KEY` (or `-JapiKey=...`).
2. `GET /phone/numbers` and select phones.
3. Select one phone as the **simulation sender**.
4. Create deliverability test (`POST /test/deliverability`) with scope `PHONE`.
5. Exclude the simulation sender from targets.
6. Start test (`POST /test/deliverability/{testId}/start`).
7. If `sendMode=SIMULATOR`, create simulation job (`POST /test/deliverability/{testId}/simulation-jobs`).
8. Poll status (`GET /test/deliverability/{testId}/status`) until done/fail/timeout.
9. Emit final pass/fail result for CI.

### Why exclude the simulation sender?

Some telecom routes can allow self-delivery/loopback behavior. We explicitly exclude the sender phone from target selection to keep results clean and deterministic.

## Run Modes

### `runType=ALL` (default)

- Selector: `type=ALL`
- Targets: all phones in scope
- Excludes: simulation sender phone ID

### `runType=SINGLE`

- Uses first page of phones from `/phone/numbers`
- `content[0]` = simulation sender
- `content[1]` = single explicit target
- Selector: `type=EXPLICIT`, `entityIds=[content[1].id]`
- Excludes: `excludeEntityIds=[content[0].id]`

`SINGLE` requires at least 2 phone numbers.

## Send Modes

### `sendMode=SIMULATOR` (default)

This example creates a MailSlurp simulation job to generate SMS sends automatically.

### `sendMode=EXTERNAL`

Simulation call is skipped. Use this when you want your own system-under-test to send SMS while MailSlurp deliverability test tracks outcomes.

## Project Files

- HTTP plan: `java-jmeter-sms-deliverability-loadtest/src/test/jmeter/basic-smoke.jmx`
- Java sampler plan: `java-jmeter-sms-deliverability-loadtest/src/test/jmeter/basic-smoke-java-sdk.jmx`
- Java sampler class: `java-jmeter-sms-deliverability-loadtest/src/main/java/com/example/jmeter/MailSlurpDeliverabilityJavaSampler.java`
- Maven module: `java-jmeter-sms-deliverability-loadtest`
- Local OpenAPI source: `api-docs.json`
- Long-form guide/blog: `BLOG-SMS-DELIVERABILITY-JMETER.md`

## Prerequisites

- Java 17+
- Maven 3.9+
- MailSlurp API key
- At least 1 phone number (`ALL`) or 2+ (`SINGLE`)

## Quick Start

Set your key:

```bash
export API_KEY='your_mailslurp_api_key'
```

### HTTP approach

```bash
make test-http-all
make test-http-single
```

### Java SDK approach

```bash
make test-java-all
make test-java-single
```

### Backward-compatible shortcuts (HTTP default)

```bash
make test
make test-all
make test-single
```

## GUI Usage

JMeter is auto-downloaded to `opt/` on first GUI run.

```bash
make gui                 # HTTP plan
make gui-single          # HTTP + runType=SINGLE
make gui-java            # Java sampler plan
make gui-java-single     # Java sampler + runType=SINGLE
```

## Make Targets

List all commands:

```bash
make help
```

Most used:

- `make test-http-all`
- `make test-http-single`
- `make test-java-all`
- `make test-java-single`
- `make report-http`
- `make report-java`
- `make logs-tail`
- `make logs-tail-java`

Optional runtime override:

```bash
API_KEY=... SEND_MODE=EXTERNAL make test-java-single
```

## Reports and Logs

### Console progress markers

HTTP approach prints:

- `JMETER_SETUP ...`
- `JMETER_PROGRESS ...`
- `JMETER_FINAL ...`

Java approach prints:

- `JMETER_JAVA_SETUP ...`
- `JMETER_JAVA_PROGRESS ...`
- `JMETER_JAVA_FINAL ...`
- `JMETER_JAVA_ERROR ...`

### JMeter logs

- HTTP log: `java-jmeter-sms-deliverability-loadtest/target/jmeter/logs/basic-smoke.jmx.log`
- Java log: `java-jmeter-sms-deliverability-loadtest/target/jmeter/logs/basic-smoke-java-sdk.jmx.log`

### Result CSV

- HTTP: `java-jmeter-sms-deliverability-loadtest/target/jmeter/results/*-basic-smoke.csv`
- Java: `java-jmeter-sms-deliverability-loadtest/target/jmeter/results/*-basic-smoke-java-sdk.csv`

### HTML dashboard report

```bash
make report-http
make report-java
```

Outputs:

- `java-jmeter-sms-deliverability-loadtest/target/jmeter/report/basic-smoke/index.html`
- `java-jmeter-sms-deliverability-loadtest/target/jmeter/report/basic-smoke-java-sdk/index.html`

## JMeter Conventions Used Here

- Single-thread reference flow for clarity and reproducibility.
- Explicit phase naming (`1)`, `2)`, ...).
- Preflight validation for API key and mode parameters.
- 2xx assertions on API calls.
- JSON extraction + strict ID validation.
- Poll-loop with deterministic timeout gates.
- CI-safe final pass/fail sampler.
- Section comments directly in JMX XML for source readability.
- Distinct console markers for setup/progress/final status.

## Troubleshooting

### No useful output while running

Use:

```bash
make logs-tail
make logs-tail-java
```

### Java/Groovy compatibility error (`Unsupported class file major version`)

The `Makefile` auto-selects Java 21/17 on macOS for JMeter runs. You can also force:

```bash
API_KEY=... JAVA_COMPAT_HOME=$(/usr/libexec/java_home -v 21) make test-single
```

### `SINGLE` mode seems to run all targets

Confirm run actually used `runType=SINGLE` and check setup log lines:

- HTTP: `JMETER_SETUP runType=SINGLE simulationPhoneId=... targetPhoneId=...`
- Java: `JMETER_JAVA_SETUP phoneCount=... runType=SINGLE simulationPhoneId=... targetPhoneId=...`

### `SINGLE` mode requirements

You must have at least 2 phones in the account.

## Notes for Teams Integrating Their Own Sender

Set `sendMode=EXTERNAL` and trigger your platform's SMS sender after test start.

You still get MailSlurp deliverability status/progress tracking and deterministic polling without fragile inbox `waitFor` patterns.

## References

- Deliverability tests: <https://docs.mailslurp.com/deliverability-test/>
- API docs (OpenAPI): <https://api.mailslurp.com/v2/api-docs>
- SMS/email deliverability load testing guide: <https://www.mailslurp.com/guides/email-and-sms-deliverability-load-testing/>
