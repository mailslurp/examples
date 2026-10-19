# Playwright SMS testing in Python

A Python version of [the JavaScript Playwright SMS example](../playwright-sms-testing/tests/example.spec.ts), using the official `mailslurp-client` Python SDK and `pytest-playwright`.

The test opens the SMS playground, selects the first US phone number in your MailSlurp account, signs up, waits for an unread SMS, extracts its six-digit confirmation code, confirms the account, and signs in. It saves the same six screenshots under `screenshots/`.

## Run

Use Python 3.10 or newer, [uv](https://docs.astral.sh/uv/getting-started/installation/), and an SMS-enabled MailSlurp account with an existing US phone number. The number must have no existing account on [the SMS playground](https://playground-sms.mailslurp.com) and no stale unread verification messages. As in the JavaScript example, the test leaves the playground user registered, so use a fresh number or reset that user before rerunning.

```sh
cd playwright-python-sms
make install
make test
```

The Makefile loads `API_KEY` from the repository's `../.env` file. You can also run
`API_KEY=your_mailslurp_api_key make test`. `make install` uses `uv sync --locked`
to create `.venv` and install dependencies from `uv.lock`, then downloads Chromium.
`make test` syncs dependencies and runs pytest through uv. To watch the browser,
run `make test PYTEST_ARGS="--headed"`.

To run without Make:

```sh
uv sync --locked
uv run --no-sync python -m playwright install chromium
API_KEY=your_mailslurp_api_key uv run --no-sync python -m pytest
```

On Linux, use `uv run python -m playwright install --with-deps chromium` if browser
system dependencies are missing. Dependencies are declared in `pyproject.toml`;
run `uv lock` after changing them. Traces and videos are retained under
`test-results/` when a test fails.

SDK references: [phone numbers](https://python.mailslurp.com/api/phone_controller_api.html), [SMS waits](https://python.mailslurp.com/api/wait_for_controller_api.html).
