package com.mailslurp.examples.steps;

import com.mailslurp.clients.ApiException;
import com.mailslurp.models.InboxDto;
import net.thucydides.core.annotations.Steps;
import org.jbehave.core.annotations.Given;
import org.jbehave.core.annotations.Then;
import org.jbehave.core.annotations.When;

import com.mailslurp.examples.steps.serenity.EndUserSteps;

public class DefinitionSteps {

    private InboxDto inbox;

    @Steps
    EndUserSteps endUser;

    @Given("the user has email address and is on the example application page")
    public void givenTheUserIsOnTheExampleApplicationPage() throws ApiException {
        inbox = endUser.has_email_address();
        endUser.is_on_the_application_page();
    }

    @When("the user signs up with an email address and password '$password'")
    public void thenTheUserSignsUpWithAnEmailAddressAndPassword(String password) {
        endUser.signs_up_with_email_address_and_password(inbox, password);
    }

    @Then("they receive a confirmation code, confirm their account, login with '$password' and see '$message'")
    public void thenTheyReceiveAConfirmationCodeConfirmTheirAccountLoginAndSee(String password, String message) throws ApiException {
        endUser.receive_confirmation_confirm_account_login_and_see_message(inbox, password, message);
    }

}
