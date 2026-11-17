// The same sign-in, but the app sends a real SMS through its provider and the test reads it
// from a MailSlurp phone number. Run with: npm run test:sms (see README for the settings).
import { expect, test } from "@playwright/test";
import { MailSlurp, SmsMatchOptionFieldEnum, SmsMatchOptionShouldEnum } from "mailslurp-client";
import { codeMarker, expectSignedIn, extractCode, submitCode, submitPassword } from "./flow";

const apiKey = process.env.MAILSLURP_API_KEY ?? "";
const phoneNumberId = process.env.MAILSLURP_PHONE_ID ?? "";

test("signs in with the code delivered to a real phone number", async ({ page }, testInfo) => {
  const mailslurp = new MailSlurp({ apiKey });
  // Count only messages that arrive after this test asks for a code.
  const since = new Date();

  await submitPassword(page);

  const [sms] = await mailslurp.waitController.waitForSms({
    waitForSmsConditions: {
      phoneNumberId,
      since,
      count: 1,
      timeout: 60_000,
      matches: [{ field: SmsMatchOptionFieldEnum.BODY, should: SmsMatchOptionShouldEnum.CONTAIN, value: codeMarker }],
    },
  });
  expect(sms, "No Demo App code arrived within 60 seconds").toBeTruthy();
  const seconds = (new Date(sms.createdAt).getTime() - since.getTime()) / 1000;
  testInfo.annotations.push({ type: "delivery", description: `SMS received ${seconds.toFixed(1)} s after the request` });

  await submitCode(page, extractCode(sms.body));
  await expectSignedIn(page);
});
