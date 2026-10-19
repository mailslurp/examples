import os
import re
from pathlib import Path

import mailslurp_client
from playwright.sync_api import Page, expect


FORM_SELECTOR = "[class^='Form__formSection']"
SCREENSHOTS = Path(__file__).resolve().parents[1] / "screenshots"


def test_can_login_and_verify_sms_with_mailslurp(page: Page) -> None:
    # Use an SMS-enabled account and a number with no existing playground user.
    api_key = os.environ.get("API_KEY")
    assert api_key, "Set API_KEY to your MailSlurp API key."
    SCREENSHOTS.mkdir(exist_ok=True)

    page.goto("https://playground-sms.mailslurp.com")
    page.locator(FORM_SELECTOR).screenshot(path=SCREENSHOTS / "01-load-page.jpg")

    # Open the sign-up form, just as in playwright-sms-testing.
    page.click('[data-test="sign-in-create-account-link"]')
    page.locator(FORM_SELECTOR).screenshot(path=SCREENSHOTS / "02-create-account.jpg")

    configuration = mailslurp_client.Configuration()
    configuration.api_key["x-api-key"] = api_key
    with mailslurp_client.ApiClient(configuration) as api_client:
        # Fetch the first existing US phone number from our account.
        phone_controller = mailslurp_client.PhoneControllerApi(api_client)
        phones = phone_controller.get_phone_numbers(phone_country="US")
        assert phones.content, "Add a US phone number to your MailSlurp account first."
        phone = phones.content[0]
        assert phone.phone_number.startswith("+1"), "Expected a US phone number."

        password = "test-password-123"
        page.fill('input[name=phone_line_number]', phone.phone_number.removeprefix("+1"))
        page.fill('input[name=password]', password)
        page.locator(FORM_SELECTOR).screenshot(path=SCREENSHOTS / "03-fill.jpg")

        page.click('[data-test="sign-up-create-account-button"]')
        # Wait up to 30 seconds for the unread verification SMS.
        wait_controller = mailslurp_client.WaitForControllerApi(api_client)
        sms = wait_controller.wait_for_latest_sms(
            wait_for_single_sms_options=mailslurp_client.WaitForSingleSmsOptions(
                phone_number_id=phone.id,
                unread_only=True,
                timeout=30_000,
            )
        )
        match = re.search(r"([0-9]{6})$", sms.body or "")
        assert match, "Expected a six-digit confirmation code at the end of the SMS."
        code = match.group(1)

        page.fill('[data-test="confirm-sign-up-confirmation-code-input"]', code)
        page.locator(FORM_SELECTOR).screenshot(path=SCREENSHOTS / "04-confirm.jpg")
        page.click('[data-test="confirm-sign-up-confirm-button"]')

        # Sign in with the full phone number, including its country code.
        page.fill('[data-test="username-input"]', phone.phone_number)
        page.fill('[data-test="sign-in-password-input"]', password)
        page.locator(FORM_SELECTOR).screenshot(path=SCREENSHOTS / "05-sign-in.jpg")
        page.click('[data-test="sign-in-sign-in-button"]')
        expect(page.locator('[data-test="greetings-nav"]')).to_be_visible(timeout=30_000)

        # Give the greeting image time to appear before taking the last screenshot.
        page.wait_for_timeout(1000)
        page.screenshot(path=SCREENSHOTS / "06-greeting.jpg")
