import {expect, test} from '@playwright/test';
import MailSlurp, {GetPhoneNumbersPhoneCountryEnum} from "mailslurp-client";
const formSelector = "[class^='Form__formSection']"
test.describe('test sms login with playwright', () => {
  test('can login and verify sms with mailslurp', async ({ page, browser }) => {
    // use sms enabled account
    // ensure no user exists already for number
    const apiKey = process.env.API_KEY;
    expect(apiKey).toBeDefined();

    await page.goto("https://playground-sms.mailslurp.com");
    await page.locator(formSelector).screenshot({ path: './screenshots/01-load-page.jpg' });


    //<gen>playwright_sms_start
    // load playground app
    await page.goto("https://playground-sms.mailslurp.com");
    await page.click('[data-test="sign-in-create-account-link"]');
    //</gen>
    await page.locator(formSelector).screenshot({ path: './screenshots/02-create-account.jpg' });

    //<gen>playwright_sms_phone
    // fetch a phone number in US from our account
    const mailslurp = new MailSlurp({ apiKey })
    const { content }= await mailslurp.phoneController.getPhoneNumbers({
      phoneCountry: GetPhoneNumbersPhoneCountryEnum.US
    })
    const phone = content?.[0]!!
    //</gen>

    //<gen>playwright_sms_fill_form
    const password = "test-password-123"
    // fill sign up form
    await page.fill('input[name=phone_line_number]', phone.phoneNumber.replace("+1", ""));
    await page.fill('input[name=password]', password);
    //</gen>
    await page.locator(formSelector).screenshot({ path: './screenshots/03-fill.jpg' });

    //<gen>playwright_sms_wait
    await page.click('[data-test="sign-up-create-account-button"]');
    // wait for verification code
    const sms = await mailslurp.waitController.waitForLatestSms({
      waitForSingleSmsOptions: {
        phoneNumberId: phone.id,
        unreadOnly: true,
        timeout: 30_000,
      }
    })
    // extract the confirmation code (so we can confirm the user)
    const code = /([0-9]{6})$/.exec(sms.body)?.[1]!!;
    //</gen>

    //<gen>playwright_sms_code
    // enter confirmation code
    await page.fill('[data-test="confirm-sign-up-confirmation-code-input"]', code);
    //</gen>
    await page.locator(formSelector).screenshot({ path: './screenshots/04-confirm.jpg' });
    //<gen>playwright_sms_submit
    await page.click('[data-test="confirm-sign-up-confirm-button"]');
    //</gen>
    //<gen>playwright_sms_fill_sign_in
    // fill out username (email) and password
    await page.fill('[data-test="username-input"]', phone.phoneNumber);
    await page.fill('[data-test="sign-in-password-input"]', password);
    //</gen>
    await page.locator(formSelector).screenshot({ path: './screenshots/05-sign-in.jpg' });
    //<gen>playwright_sms_greeting
    // submit
    await page.click('[data-test="sign-in-sign-in-button"]');
    await page.waitForSelector("[data-test='greetings-nav']")
    //</gen>
    // let image appear
    await page.waitForTimeout(1000)
    await page.screenshot({ path: './screenshots/06-greeting.jpg' });
  });

});