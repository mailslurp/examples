package com.mailslurp.examples.pages;

import net.serenitybdd.core.Serenity;
import net.thucydides.core.annotations.DefaultUrl;
import net.thucydides.core.pages.PageObject;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

@DefaultUrl("https://playground.mailslurp.com")
public class PlaygroundApplication extends PageObject {

    public void sign_up_with_email_and_password(String emailAddress, String password) {
        // click sign up button
        find("//a[@data-test='sign-in-create-account-link']").click();
        // expect sign up page
        waitFor("//*[@data-test='sign-up-header-section']//span").shouldContainText("Sign Up");
        // enter email and password
        find("//*[@name='email']").type(emailAddress);
        find("//*[@name='password']").type(password);
        // submit sign up
        find("//button[@data-test='sign-up-create-account-button']").click();
        // should show confirm page
        waitFor("//*[@data-test='confirm-sign-up-header-section']//span").shouldContainText("Confirm");
    }

    public void wait_for_page_text(String text) {
        waitForCondition().until(ExpectedConditions.textToBePresentInElement(find(By.tagName("BODY")), text));
    }

    public void login_with_email_address_and_password(String emailAddress, String password) {
        // enter email and password
        find("//*[@data-test='username-input']").type(emailAddress);
        find("//*[@data-test='sign-in-password-input']").type(password);
        find("//button[@data-test='sign-in-sign-in-button']").click();
    }

    public void submit_confirmation_code(String code) {
        find("//*[@name='code']").type(code);
        find("//button[@data-test='confirm-sign-up-confirm-button']").click();
    }
}
