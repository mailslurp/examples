# AGENTS.md

Brief instructions for coding agents in this repo.

## Project Layout
- Root has automation and docs.
- Maven module is in `java-jmeter-sms-deliverability-loadtest/`.

## Prerequisites
- Java 17+
- Maven 3.9+
- `API_KEY` must be set for tests that instantiate MailSlurp clients.

## Common Commands
- Unit tests: `API_KEY=... make test`
- Full verify (includes JMeter): `API_KEY=... make verify`
- Force dependency refresh after new publishes: `API_KEY=... make test MVN_ARGS=-U`

## Notes
- MailSlurp dependency is pinned to `com.mailslurp:mailslurp-client-java:17.1.0`.
- JMeter test plan: `java-jmeter-sms-deliverability-loadtest/src/test/jmeter/basic-smoke.jmx`.
