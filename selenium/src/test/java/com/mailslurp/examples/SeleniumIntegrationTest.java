package com.mailslurp.examples;

import com.mailslurp.api.api.CommonOperationsApi;
import com.mailslurp.client.ApiException;
import com.mailslurp.examples.config.MailSlurpConfig;
import com.mailslurp.examples.config.SeleniumConfig;
import com.mailslurp.models.Email;
import com.mailslurp.models.Inbox;
import java.time.Instant;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.Assert.assertThat;

@RunWith(BlockJUnit4ClassRunner.class)
public class SeleniumIntegrationTest {

    private final static Pattern VERIFICATION_CODE_PATTERN = Pattern.compile(".*verification code is (\\d+).*");
    private final static String API_KEY = System.getenv("API_KEY");
    private final static String WEBSITE_URL = System.getenv("WEBSITE_URL");

    private static SeleniumConfig config;
    private static WebDriver driver;
    private static CommonOperationsApi mailslurp;
    private static String randomPassword;

    @BeforeClass
    public static void beforeAll() throws ApiException {
        // configure selenium for Firefox
        config = new SeleniumConfig();
        driver = config.getDriver();

        mailslurp = new MailSlurpConfig().getClient(API_KEY);
        randomPassword = "random-" + Instant.now().toEpochMilli();
    }

    @AfterClass
    public static void after() {
        driver.close();
    }

    @Test
    public void canLoadUserSignUpPage() throws ApiException, InterruptedException {
        // visit playground.mailslurp.com to demonstrate testing of user sign-up
        // with an application that requires email verification
        driver.get(WEBSITE_URL);
        assertThat(driver.getTitle(), equalTo("React App"));
        driver.findElement(By.cssSelector("[data-test=sign-in-create-account-link]")).click();

        // create a real, randomized email address with MailSlurp to represent a user
        Inbox inbox = mailslurp.createNewEmailAddress();
        assertThat(inbox.getEmailAddress(), containsString("@mailslurp.com"));

        // fill the playground app's sign-up form with the MailSlurp
        // email address and a random password
        driver.findElement(By.name("email")).sendKeys(inbox.getEmailAddress());
        driver.findElement(By.name("password")).sendKeys(randomPassword);

        // submit the form to trigger the playgrounds email confirmation process
        driver.findElement(By.cssSelector("[data-test=sign-up-create-account-button]")).click();

        // receive a verification email from playground using mailslurp
        Email email = mailslurp.waitForLatestEmail(inbox.getId(), 60000L);
        assertThat(email.getSubject(), containsString("Please confirm your email address"));

        // extract verification code needed to confirm account
        Matcher matcher = VERIFICATION_CODE_PATTERN.matcher(email.getBody());
        assertThat(matcher.find(), equalTo(true));
        String code = matcher.group(1);
        assertThat(code.length(), equalTo(6));

        // subject verification code to playground page
        driver.findElement(By.name("code")).sendKeys(code);
        driver.findElement(By.cssSelector("[data-test=confirm-sign-up-confirm-button]")).click();

        // finally login with now confirmed email address
        driver.get(WEBSITE_URL);
        driver.findElement(By.name("username")).sendKeys(inbox.getEmailAddress());
        driver.findElement(By.name("password")).sendKeys(randomPassword);
        driver.findElement(By.cssSelector("[data-test=sign-in-sign-in-button]")).click();

        // verify that user can see authenticated content
        // a cute dog and a welcome message
        assertThat(driver.findElement(By.tagName("h1")).getText(), containsString("Welcome"));
    }


    @Test
    public void regexWorks() {
        String subject = "Your Demo verification code is 206354";
        Matcher matcher = VERIFICATION_CODE_PATTERN.matcher(subject);
        assertThat(matcher.find(), equalTo(true));
        assertThat(matcher.group(1), equalTo("" + 206354));
    }
}
