// A real SMS code, end to end: sign up to MailSlurp's SMS playground with a MailSlurp phone number,
// read the verification text through the API, confirm the account, sign in, then delete the user.
// Run with: npm run test:sms (needs MAILSLURP_API_KEY and a US number in the account).
//<gen>sms_otp_playwright_real_setup
import { test } from "@playwright/test";
import { MailSlurp, SmsMatchOptionFieldEnum, SmsMatchOptionShouldEnum } from "mailslurp-client";
import { confirmAndSignIn, deleteSignedInUser, extractCode, findTestPhone, removeLeftoverUser, signUp } from "./playground";

const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY ?? "" });
//</gen>

//<gen>sms_otp_playwright_real_number
test("signs up with the SMS code sent to a real phone number", async ({ page }, testInfo) => {
  const phone = await findTestPhone(mailslurp);
  await removeLeftoverUser(page, phone.phoneNumber);

  // Count only messages that arrive after this test asks for a code.
  const since = new Date();
  await signUp(page, phone.phoneNumber);

  const [sms] = await mailslurp.waitController.waitForSms({
    waitForSmsConditions: {
      phoneNumberId: phone.id,
      since,
      count: 1,
      timeout: 60_000,
      matches: [{ field: SmsMatchOptionFieldEnum.BODY, should: SmsMatchOptionShouldEnum.CONTAIN, value: "demo-sms verification code" }],
    },
  });
  const seconds = (new Date(sms.createdAt).getTime() - since.getTime()) / 1000;
  testInfo.annotations.push({ type: "delivery", description: `SMS received ${seconds.toFixed(1)} s after sign-up` });

  await confirmAndSignIn(page, phone.phoneNumber, extractCode(sms.body));

  // Leave the number free to sign up again on the next run.
  await deleteSignedInUser(page);
});
//</gen>
