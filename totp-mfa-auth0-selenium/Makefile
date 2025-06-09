SHELL := /usr/bin/env bash
.ONESHELL:
.SHELLFLAGS := -ec
.PHONY: install start test clean

# install JS deps & build test JAR
.installed:
	npm install
	mvn -f tests/pom.xml clean compile
	touch .installed

# start Vue dev server in background
start:
	@echo "Starting Vue app..."
	@npm run start &\
	echo $$! > .app.pid ;\
	sleep 5

# run Selenium tests (requires app running)
test: start
	trap 'echo "Stopping Vue server..."; kill $$(cat .app.pid) && rm .app.pid;' EXIT
	echo "Running Selenium tests..."
	mvn -f tests/pom.xml test

clean:
	-@kill $$(cat .app.pid) 2>/dev/null || true
	rm -f .app.pid
	npm run build-clean  # if you have a clean script
	mvn -f tests/pom.xml clean
