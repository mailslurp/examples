package com.mailslurp.examples;

import com.mailslurp.apis.SmsControllerApi;
import com.mailslurp.apis.PhoneControllerApi;
import com.mailslurp.apis.WaitForControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.*;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.remote.CapabilityType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.Assert.*;

/**
 * Example Selenium test-suite that loads a dummy authentication website
 * and tests user sign-up with an SMS verification process
 *
 * See https://www.mailslurp.com/examples/ for more information.
 */
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class SmsUsageTest {
    // website useful for testing, has a real authentication flow
    private static final String PLAYGROUND_URL = "https://playground-sms.mailslurp.com";

    // get a MailSlurp API Key free at https://app.mailslurp.com
    private static final String YOUR_API_KEY = System.getenv("API_KEY");

    private static final String WEBDRIVER_PATH = System.getenv("PATH_TO_WEBDRIVER");
    private static final String FIREFOX_PATH = System.getenv("PATH_TO_FIREFOX");
    private static final Boolean UNREAD_ONLY = true;
    private static final Long TIMEOUT_MILLIS = 30000L;

    private static ApiClient mailslurpClient;
    private static WebDriver driver;

    private static final String TEST_PASSWORD = "password-" + new Random().nextLong();

    private static PhoneNumberProjection phone;
    private static SmsDto sms;
    private static String confirmationCode;

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    /**
     * Setup selenium webdriver and MailSlurp client (for fetching emails)
     */
    //<gen>selenium_sms_maven_before_all
    @BeforeClass
    public static void beforeAll() {
        assertNotNull(YOUR_API_KEY);
        assertNotNull(WEBDRIVER_PATH);
        assertNotNull(FIREFOX_PATH);

        // setup mailslurp
        mailslurpClient = Configuration.getDefaultApiClient();
        mailslurpClient.setApiKey(YOUR_API_KEY);
        mailslurpClient.setConnectTimeout(TIMEOUT_MILLIS.intValue());

        // setup webdriver (expects geckodriver binary at WEBDRIVER_PATH)
        assertTrue(new File(WEBDRIVER_PATH).exists());
        System.setProperty("webdriver.gecko.driver", WEBDRIVER_PATH);
        FirefoxProfile profile = new FirefoxProfile();
        profile.setAssumeUntrustedCertificateIssuer(true);
        profile.setAcceptUntrustedCertificates(true);
        FirefoxOptions options = new FirefoxOptions();
        // expects firefox binary at FIREFOX_PATH
        options.setBinary(FIREFOX_PATH);
        options.setCapability(CapabilityType.ACCEPT_INSECURE_CERTS, true);
        options.setProfile(profile);
        options.setAcceptInsecureCerts(true);
        driver = new FirefoxDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.of(TIMEOUT_MILLIS, ChronoUnit.MILLIS));
    }
    //</gen>

    /**
     * Load the playground site in selenium
     */
    @Test
    public void test1_canLoadAuthenticationPlayground() {
        logger.info("Load playground");
        driver.get(PLAYGROUND_URL);
        assertEquals(driver.getTitle(), "React App");
    }

    /**
     * Start the sign-up process
     */
    @Test
    public void test2_canClickSignUpButton() {
        logger.info("Click sign up button");
        driver.findElement(By.cssSelector("[data-test=sign-in-create-account-link]")).click();
    }

    //<gen>selenium_sms_maven_inbox
    /**
     * Get a MailSlurp phone numberand use it to start sign-up on the playground
     */
    @Test
    public void test3_fetchPhoneAndSignUp() throws ApiException {
        // fetch one of the phone numbers we have created in app.mailslurp.com
        logger.info("Get a phone number from account");
        PhoneControllerApi phoneControllerApi = new PhoneControllerApi(mailslurpClient);
        phone = phoneControllerApi.getPhoneNumbers().execute().getContent().get(0);

        logger.info("Assert phone exists");
        assertNotNull(phone.getId());

        logger.info("Fill elements");
        // fill the playground app's sign-up form with the MailSlurp
        // email address and a random password
        driver.findElement(By.id("phone_line_number")).sendKeys(phone.getPhoneNumber().replace("+1", ""));
        driver.findElement(By.name("password")).sendKeys(TEST_PASSWORD);

        logger.info("Submit sign-up button");
        // submit the form to trigger the playground's phone confirmation process
        // we will need to receive the confirmation sms and extract a code
        driver.findElement(By.cssSelector("[data-test=sign-up-create-account-button]")).click();
    }
    //</gen>

    /**
     * Use MailSlurp to receive the confirmation SMS that is sent by playground
     */
    @Test
    public void test4_canReceiveConfirmationSms() throws ApiException {
        // receive a verification email from playground using mailslurp
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(mailslurpClient);
        WaitForSingleSmsOptions waitOptions = new WaitForSingleSmsOptions().phoneNumberId(phone.getId()).timeout(TIMEOUT_MILLIS);
        sms = waitForControllerApi.waitForLatestSms(waitOptions).execute();

        // verify the contents is present
        assertNotNull(sms);

        // if we need to send a reply like "CONFIRM" can do so
        // PhoneControllerApi phoneControllerApi = new PhoneControllerApi(mailslurpClient);
        // phoneControllerApi.sendSmsFromPhoneNumber(phone.getId(), new SmsSendOptions().to(...).body(...)).execute();

        // create a regex for matching the code we expect in the sms body
        Pattern p = Pattern.compile(".*([0-9]{6}).*");
        Matcher matcher = p.matcher(sms.getBody());

        // find first occurrence and extract
        assertTrue(matcher.find());
        confirmationCode = matcher.group(1);

        assertTrue(confirmationCode.length() == 6);
    }

    /**
     * Submit the confirmation code to the playground to confirm the user
     */
    @Test
    public void test5_canSubmitVerificationCodeToPlayground() throws InterruptedException {
        driver.findElement(By.name("code")).sendKeys(confirmationCode);
        driver.wait(1000L);
        driver.findElement(By.cssSelector("[data-test=confirm-sign-up-confirm-button]")).click();
    }

    /**
     * Test sign-in as confirmed user
     */
    @Test
    public void test6_canLoginWithConfirmedUser() {
        // load the main playground login page
        driver.get(PLAYGROUND_URL);

        // login with now confirmed email address
        driver.findElement(By.name("username")).sendKeys(phone.getPhoneNumber());
        driver.findElement(By.name("password")).sendKeys(TEST_PASSWORD);
        driver.findElement(By.cssSelector("[data-test=sign-in-sign-in-button]")).click();

        // verify that user can see authenticated content
        assertTrue(driver.findElement(By.tagName("h1")).getText().contains("Welcome"));
    }

    /**
     * After tests close selenium
     */
    @AfterClass
    public static void afterAll() {
        driver.close();
    }

}
