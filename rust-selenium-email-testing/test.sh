#!/bin/bash
set -e

echo "Starting selenium"

# start selenium
java -Dwebdriver.gecko.driver="$DRIVER_LOCATION" -jar "$SELENIUM_LOCATION" &
PID=$!

echo "Server running on process $PID"

echo "Waiting for server response"
timeout 300 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:4444)" != '200' ]]; do sleep 5; done' || false

echo "Running tests"
{ # try
    cargo test && echo "Tests passed. Killing process $PID" && kill "$PID"
} || { # catch
    echo "Tests failed. Killing process $PID" && kill "$PID"
}

