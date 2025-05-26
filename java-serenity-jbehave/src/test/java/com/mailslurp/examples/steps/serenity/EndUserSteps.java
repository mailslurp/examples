package com.mailslurp.examples.steps.serenity;

import com.mailslurp.examples.MailSlurpClient;
import com.mailslurp.examples.pages.PlaygroundApplication;
import com.mailslurp.models.Email;
import com.mailslurp.models.InboxDto;
import com.mailslurp.models.InboxDto;
import io.cucumber.java.eo.Se;
import net.serenitybdd.core.Serenity;
import net.thucydides.core.annotations.Step;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;

import com.mailslurp.apis.*;
import com.mailslurp.clients.*;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EndUserSteps {

    PlaygroundApplication playgroundApplication;
    MailSlurpClient mailSlurpClient = new MailSlurpClient();

    @Step
    public InboxDto has_email_address() throws ApiException {

        // create an inbox controller to create a real email address
        InboxControllerApi inboxControllerApi = new InboxControllerApi(mailSlurpClient.getClient());

        // create an email address for the test user
        InboxDto inbox = inboxControllerApi.createInbox().execute();
        assertThat(inbox.getEmailAddress(), containsString("@mailslurp."));

        return inbox;
    }

    @Step
    public void is_on_the_application_page() {
        playgroundApplication.open();
    }

    @Step
    public void receive_confirmation_confirm_account_login_and_see_message(InboxDto inbox, String password, String message) throws ApiException {
        // fetch the latest email for the inbox
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(mailSlurpClient.getClient());
        Email email = waitForControllerApi.waitForLatestEmail().inboxId(inbox.getId()).timeout(MailSlurpClient.TIMEOUT).unreadOnly(true).execute();

        // extract the code from the email
        Pattern p = Pattern.compile("Your Demo verification code is ([0-9]{6})");
        Matcher m = p.matcher(email.getBody());
        m.find();
        String code = m.group(1);

        // submit the code
        playgroundApplication.submit_confirmation_code(code);

        // now login
        playgroundApplication.login_with_email_address_and_password(inbox.getEmailAddress(), password);
        playgroundApplication.wait_for_page_text(message);
    }

    @Step
    public void signs_up_with_email_address_and_password(InboxDto inbox, String password) {
        playgroundApplication.sign_up_with_email_and_password(inbox.getEmailAddress(), password);
    }
}