-include .env
-include ../.env

PROJECT_DIR := java-jmeter-sms-deliverability-loadtest
JMX_HTTP_FILE := $(PROJECT_DIR)/src/test/jmeter/basic-smoke.jmx
JMX_JAVA_FILE := $(PROJECT_DIR)/src/test/jmeter/basic-smoke-java-sdk.jmx
JMX_HTTP_NAME := basic-smoke.jmx
JMX_JAVA_NAME := basic-smoke-java-sdk.jmx

JMETER_VERSION ?= 5.6.3
JMETER_BASE_DIR := opt
JMETER_ARCHIVE := apache-jmeter-$(JMETER_VERSION).tgz
JMETER_URL := https://archive.apache.org/dist/jmeter/binaries/$(JMETER_ARCHIVE)
JMETER_DIR := $(JMETER_BASE_DIR)/apache-jmeter-$(JMETER_VERSION)
JMETER_BIN := $(JMETER_DIR)/bin/jmeter

MVN_ARGS ?=
MVN := mvn -B -Dmaven.repo.local=../.m2 $(MVN_ARGS)
SEND_MODE ?= $(if $(strip $(sendMode)),$(sendMode),SIMULATOR)

# Prefer API_KEY from shell environment over .env includes,
# unless API_KEY was explicitly passed on make command line.
API_KEY_ENV := $(shell printenv API_KEY)
ifneq ($(origin API_KEY),command line)
ifneq ($(strip $(API_KEY_ENV)),)
API_KEY := $(API_KEY_ENV)
endif
endif

# JMeter 5.6.3 + Groovy scripts can fail on very new JVMs (e.g. Java 25).
# On macOS, auto-pick a compatible JVM (21, then 17, then 18) unless overridden.
AUTO_JAVA_HOME := $(shell if [ -x /usr/libexec/java_home ]; then /usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 18 2>/dev/null; fi)
SDKMAN_JAVA_HOME := $(if $(wildcard $(HOME)/.sdkman/candidates/java/current/bin/java),$(HOME)/.sdkman/candidates/java/current,)
JAVA_COMPAT_HOME ?= $(AUTO_JAVA_HOME)
ifeq ($(strip $(JAVA_COMPAT_HOME)),)
JAVA_COMPAT_HOME := $(SDKMAN_JAVA_HOME)
endif
ifneq ($(strip $(JAVA_COMPAT_HOME)),)
JAVA_COMPAT_PREFIX := JAVA_HOME="$(JAVA_COMPAT_HOME)" PATH="$(JAVA_COMPAT_HOME)/bin:$$PATH"
else
JAVA_COMPAT_PREFIX :=
endif

# Assertion context (override when running java-sdk JMX).
JMX_TEST_BASENAME ?= basic-smoke
JMETER_LOG_FILE := $(PROJECT_DIR)/target/jmeter/logs/$(JMX_TEST_BASENAME).jmx.log
JMETER_RESULT_GLOB := $(PROJECT_DIR)/target/jmeter/results/*-$(JMX_TEST_BASENAME).csv

.PHONY: \
	help \
	test test-all test-single \
	test-http test-http-all test-http-single \
	test-java test-java-all test-java-single \
	verify verify-all verify-single \
	verify-http verify-http-all verify-http-single \
	verify-java verify-java-all verify-java-single \
	unit-test \
	clean \
	jmeter-install gui gui-all gui-single gui-http gui-http-all gui-http-single gui-java gui-java-all gui-java-single \
	assert-jmeter-log logs-tail logs-follow logs-tail-http logs-tail-java logs-follow-http logs-follow-java logs-tail-impl logs-follow-impl \
	report-http report-java

help:
	@echo "Targets:"
	@echo "  make gui                - Open HTTP approach in JMeter GUI (auto-installs local JMeter under opt/)"
	@echo "  make gui-http           - Same as gui"
	@echo "  make gui-java           - Open Java SDK approach in JMeter GUI"
	@echo "  make gui-all            - HTTP GUI with runType=ALL"
	@echo "  make gui-single         - HTTP GUI with runType=SINGLE"
	@echo "  make gui-java-all       - Java SDK GUI with runType=ALL"
	@echo "  make gui-java-single    - Java SDK GUI with runType=SINGLE"
	@echo "  make test               - HTTP approach, runType=ALL (Maven verify + JMeter assertions)"
	@echo "  make test-all           - HTTP approach, runType=ALL"
	@echo "  make test-single        - HTTP approach, runType=SINGLE"
	@echo "  make test-java          - Java SDK approach, runType=ALL"
	@echo "  make test-java-all      - Java SDK approach, runType=ALL"
	@echo "  make test-java-single   - Java SDK approach, runType=SINGLE"
	@echo "  make verify             - Same as test"
	@echo "  make verify-java-single - Java SDK approach, runType=SINGLE"
	@echo "  make report-http        - Build JMeter HTML dashboard for latest HTTP CSV"
	@echo "  make report-java        - Build JMeter HTML dashboard for latest Java SDK CSV"
	@echo "  make logs-tail          - Tail latest HTTP approach JMeter log"
	@echo "  make logs-tail-java     - Tail latest Java SDK approach JMeter log"
	@echo "  make logs-follow        - Follow latest HTTP approach JMeter log"
	@echo "  make logs-follow-java   - Follow latest Java SDK approach JMeter log"
	@echo "  make unit-test          - Maven test phase only (JUnit only)"
	@echo "  make clean              - Maven clean"
	@echo "Variables:"
	@echo "  API_KEY=<key>           - MailSlurp API key (required for test/verify)"
	@echo "  SEND_MODE=SIMULATOR|EXTERNAL - Optional. EXTERNAL skips simulator job creation."
	@echo "  sendMode=...           - Backward-compatible alias for SEND_MODE"
	@echo "  JAVA_COMPAT_HOME=<path> - Optional JVM home used for JMeter/Groovy compatibility"
	@echo "  MVN_ARGS='-U ...'       - Optional extra Maven args"

guard-api-key:
	@if [ -z "$(strip $(API_KEY))" ]; then \
		echo "Error: API_KEY must be set in the environment"; \
		exit 1; \
	fi

# Backward-compatible defaults map to HTTP approach.
test: test-http

test-all: test-http-all

test-single: test-http-single

verify: verify-http

verify-all: verify-http-all

verify-single: verify-http-single

test-http: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_HTTP_NAME) -DrunType=ALL -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke

test-http-all: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_HTTP_NAME) -DrunType=ALL -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke

test-http-single: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_HTTP_NAME) -DrunType=SINGLE -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke

test-java: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_JAVA_NAME) -DrunType=ALL -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke-java-sdk

test-java-all: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_JAVA_NAME) -DrunType=ALL -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke-java-sdk

test-java-single: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(JAVA_COMPAT_PREFIX) $(MVN) verify -DjmeterTestFile=$(JMX_JAVA_NAME) -DrunType=SINGLE -DsendMode=$(SEND_MODE)
	@$(MAKE) --no-print-directory assert-jmeter-log JMX_TEST_BASENAME=basic-smoke-java-sdk

verify-http: test-http

verify-http-all: test-http-all

verify-http-single: test-http-single

verify-java: test-java

verify-java-all: test-java-all

verify-java-single: test-java-single

unit-test: guard-api-key
	cd $(PROJECT_DIR) && API_KEY="$(API_KEY)" $(MVN) test

assert-jmeter-log:
	@test -f "$(JMETER_LOG_FILE)" || { \
		echo "Error: JMeter log file not found at $(JMETER_LOG_FILE)"; \
		exit 1; \
	}
	@if grep -E 'Uncaught Exception BUG!|Unsupported class file major version|BUG! exception in phase|Exception in thread|CannotResolveClassException' "$(JMETER_LOG_FILE)" >/dev/null 2>&1; then \
		echo "Error: JMeter reported a fatal runtime/script error. See $(JMETER_LOG_FILE)"; \
		tail -n 80 "$(JMETER_LOG_FILE)"; \
		exit 1; \
	fi
	@RESULT_FILE="$$(ls -1t $(JMETER_RESULT_GLOB) 2>/dev/null | head -n 1)"; \
	if [ -z "$$RESULT_FILE" ]; then \
		echo "Error: No JMeter result CSV found for pattern $(JMETER_RESULT_GLOB)"; \
		exit 1; \
	fi; \
	if tail -n +2 "$$RESULT_FILE" | grep ',false,' >/dev/null 2>&1; then \
		echo "Error: JMeter test has failed samples. Result file: $$RESULT_FILE"; \
		tail -n +2 "$$RESULT_FILE" | grep ',false,'; \
		exit 1; \
	fi; \
	echo "Validated JMeter log and CSV: $$RESULT_FILE"

logs-tail: logs-tail-http

logs-tail-http:
	@$(MAKE) --no-print-directory logs-tail-impl JMX_TEST_BASENAME=basic-smoke

logs-tail-java:
	@$(MAKE) --no-print-directory logs-tail-impl JMX_TEST_BASENAME=basic-smoke-java-sdk

logs-tail-impl:
	@test -f "$(JMETER_LOG_FILE)" || { \
		echo "No JMeter log at $(JMETER_LOG_FILE) yet"; \
		exit 1; \
	}
	@tail -n 160 "$(JMETER_LOG_FILE)"

logs-follow:
	@$(MAKE) --no-print-directory logs-follow-http

logs-follow-http:
	@$(MAKE) --no-print-directory logs-follow-impl JMX_TEST_BASENAME=basic-smoke

logs-follow-java:
	@$(MAKE) --no-print-directory logs-follow-impl JMX_TEST_BASENAME=basic-smoke-java-sdk

logs-follow-impl:
	@test -f "$(JMETER_LOG_FILE)" || { \
		echo "No JMeter log at $(JMETER_LOG_FILE) yet"; \
		exit 1; \
	}
	@tail -f "$(JMETER_LOG_FILE)"

jmeter-install: $(JMETER_BIN)
	@echo "JMeter ready at $(JMETER_BIN)"

$(JMETER_BIN):
	@set -e; \
	mkdir -p "$(JMETER_BASE_DIR)"; \
	if [ ! -d "$(JMETER_DIR)" ]; then \
		echo "Downloading Apache JMeter $(JMETER_VERSION)"; \
		curl -fsSL "$(JMETER_URL)" -o "$(JMETER_BASE_DIR)/$(JMETER_ARCHIVE)"; \
		tar -xzf "$(JMETER_BASE_DIR)/$(JMETER_ARCHIVE)" -C "$(JMETER_BASE_DIR)"; \
		rm -f "$(JMETER_BASE_DIR)/$(JMETER_ARCHIVE)"; \
	fi
	@chmod +x "$(JMETER_BIN)"

gui: gui-http

gui-all: gui-http-all

gui-single: gui-http-single

gui-http: jmeter-install
	@echo "Opening JMeter GUI (HTTP approach): $(JMX_HTTP_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -t "$(JMX_HTTP_FILE)"

gui-http-all: jmeter-install
	@echo "Opening JMeter GUI (HTTP, runType=ALL): $(JMX_HTTP_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -JrunType=ALL -JsendMode=SIMULATOR -t "$(JMX_HTTP_FILE)"

gui-http-single: jmeter-install
	@echo "Opening JMeter GUI (HTTP, runType=SINGLE): $(JMX_HTTP_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -JrunType=SINGLE -JsendMode=SIMULATOR -t "$(JMX_HTTP_FILE)"

gui-java: jmeter-install
	@echo "Opening JMeter GUI (Java SDK approach): $(JMX_JAVA_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -t "$(JMX_JAVA_FILE)"

gui-java-all: jmeter-install
	@echo "Opening JMeter GUI (Java SDK, runType=ALL): $(JMX_JAVA_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -JrunType=ALL -JsendMode=SIMULATOR -t "$(JMX_JAVA_FILE)"

gui-java-single: jmeter-install
	@echo "Opening JMeter GUI (Java SDK, runType=SINGLE): $(JMX_JAVA_FILE)"
	@$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -JrunType=SINGLE -JsendMode=SIMULATOR -t "$(JMX_JAVA_FILE)"

report-http: jmeter-install
	@RESULT_FILE="$$(ls -1t $(PROJECT_DIR)/target/jmeter/results/*-basic-smoke.csv 2>/dev/null | head -n 1)"; \
	if [ -z "$$RESULT_FILE" ]; then \
		echo "Error: no HTTP approach CSV found"; \
		exit 1; \
	fi; \
	OUT_DIR="$(PROJECT_DIR)/target/jmeter/report/basic-smoke"; \
	rm -rf "$$OUT_DIR"; \
	$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -g "$$RESULT_FILE" -o "$$OUT_DIR"; \
	echo "HTML report generated at $$OUT_DIR/index.html"

report-java: jmeter-install
	@RESULT_FILE="$$(ls -1t $(PROJECT_DIR)/target/jmeter/results/*-basic-smoke-java-sdk.csv 2>/dev/null | head -n 1)"; \
	if [ -z "$$RESULT_FILE" ]; then \
		echo "Error: no Java SDK approach CSV found"; \
		exit 1; \
	fi; \
	OUT_DIR="$(PROJECT_DIR)/target/jmeter/report/basic-smoke-java-sdk"; \
	rm -rf "$$OUT_DIR"; \
	$(JAVA_COMPAT_PREFIX) "$(JMETER_BIN)" -g "$$RESULT_FILE" -o "$$OUT_DIR"; \
	echo "HTML report generated at $$OUT_DIR/index.html"

clean:
	cd $(PROJECT_DIR) && $(MVN) clean
