package com.smoketest.selenium;

import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.apis.WaitForControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.clients.Configuration;
import com.mailslurp.models.Email;
import com.mailslurp.models.InboxDto;

import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * OTP Email Verification Test for MuleSoft Anypoint Selenium Tests
 * 
 * Tests the complete OTP email verification flow on playground.mailslurp.com:
 * 1. Create inbox via MailSlurp API
 * 2. Sign up with inbox email + password
 * 3. Receive verification email via waitForLatestEmail
 * 4. Extract 6-digit OTP code with regex
 * 5. Enter code, confirm signup
 * 6. Login with same credentials
 * 7. Assert "Welcome" text appears
 * 
 * Uses Chrome WebDriver and MailSlurp API.
 * Requires MAILSLURP_API_KEY environment variable.
 */
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class OtpEmailVerificationTest {

    private static final String PLAYGROUND_URL = "https://playground.mailslurp.com";
    private static final String MAILSLURP_API_KEY = System.getenv("MAILSLURP_API_KEY");
    private static final String TEST_PASSWORD = "test-password";
    private static final Long TIMEOUT_MILLIS = 60000L;
    private static final Boolean UNREAD_ONLY = true;

    private static ApiClient mailslurpClient;
    private static WebDriver driver;
    private static WebDriverWait wait;

    private static InboxDto inbox;
    private static Email email;
    private static String confirmationCode;

    /**
     * Setup Chrome WebDriver and MailSlurp client
     */
    @BeforeClass
    public static void beforeAll() {
        assertNotNull("MAILSLURP_API_KEY environment variable must be set", MAILSLURP_API_KEY);

        // Setup MailSlurp client
        mailslurpClient = Configuration.getDefaultApiClient();
        mailslurpClient.setApiKey(MAILSLURP_API_KEY);
        mailslurpClient.setConnectTimeout(TIMEOUT_MILLIS.intValue());

        // Setup Chrome WebDriver
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        // Uncomment for headless mode:
        // options.addArguments("--headless");

        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofMillis(TIMEOUT_MILLIS));
        wait = new WebDriverWait(driver, Duration.ofSeconds(30));
    }

    /**
     * Load the playground site in selenium
     */
    @Test
    public void test1_canLoadAuthenticationPlayground() {
        System.out.println("Loading playground...");
        driver.get(PLAYGROUND_URL);
        assertEquals("React App", driver.getTitle());
        System.out.println("SUCCESS: Playground loaded");
    }

    /**
     * Navigate to sign-up form
     */
    @Test
    public void test2_canClickSignUpButton() {
        System.out.println("Clicking sign up button...");
        wait.until(ExpectedConditions.elementToBeClickable(
            By.cssSelector("[data-test=sign-in-create-account-link]"))).click();
        System.out.println("SUCCESS: Navigated to sign-up form");
    }

    /**
     * Create a real email address with MailSlurp and use it to start sign-up
     */
    @Test
    public void test3_canCreateEmailAddressAndSignUp() throws ApiException {
        System.out.println("Creating MailSlurp inbox...");
        
        // Create a real, randomized email address with MailSlurp
        InboxControllerApi inboxControllerApi = new InboxControllerApi(mailslurpClient);
        inbox = inboxControllerApi.createInboxWithDefaults().execute();

        // Verify inbox was created
        assertNotNull(inbox.getId());
        assertTrue(inbox.getEmailAddress().contains("@mailslurp"));
        System.out.println("SUCCESS: Created inbox: " + inbox.getEmailAddress());

        // Fill sign-up form
        System.out.println("Filling sign-up form...");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")))
            .sendKeys(inbox.getEmailAddress());
        driver.findElement(By.name("password")).sendKeys(TEST_PASSWORD);

        // Submit sign-up form
        System.out.println("Submitting sign-up form...");
        driver.findElement(By.cssSelector("[data-test=sign-up-create-account-button]")).click();
        System.out.println("SUCCESS: Sign-up form submitted");
    }

    /**
     * Receive the confirmation email via MailSlurp
     */
    @Test
    public void test4_canReceiveConfirmationEmail() throws ApiException {
        System.out.println("Waiting for confirmation email...");
        
        // Wait for verification email from playground using MailSlurp
        WaitForControllerApi waitForControllerApi = new WaitForControllerApi(mailslurpClient);
        email = waitForControllerApi.waitForLatestEmail()
            .inboxId(inbox.getId())
            .timeout(TIMEOUT_MILLIS)
            .unreadOnly(UNREAD_ONLY)
            .execute();

        // Verify the email contents
        assertTrue("Email subject should contain confirmation text",
            email.getSubject().contains("Please confirm your email address"));
        System.out.println("SUCCESS: Received confirmation email with subject: " + email.getSubject());
    }

    /**
     * Extract the 6-digit confirmation code from email body
     */
    @Test
    public void test5_canExtractConfirmationCodeFromEmail() {
        System.out.println("Extracting confirmation code from email...");
        
        // Extract the 6-digit OTP code using regex
        Pattern p = Pattern.compile("([0-9]{6})$", Pattern.MULTILINE);
        Matcher matcher = p.matcher(email.getBody());

        assertTrue("Email body should contain 6-digit confirmation code", matcher.find());
        confirmationCode = matcher.group(1);

        assertEquals("Confirmation code should be 6 digits", 6, confirmationCode.length());
        System.out.println("SUCCESS: Extracted confirmation code: " + confirmationCode);
    }

    /**
     * Submit the confirmation code to verify the account
     */
    @Test
    public void test6_canSubmitVerificationCodeToPlayground() {
        System.out.println("Submitting verification code...");
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("code")))
            .sendKeys(confirmationCode);
        driver.findElement(By.cssSelector("[data-test=confirm-sign-up-confirm-button]")).click();
        
        System.out.println("SUCCESS: Verification code submitted");
    }

    /**
     * Login with confirmed user credentials and verify welcome message
     */
    @Test
    public void test7_canLoginWithConfirmedUser() {
        System.out.println("Logging in with confirmed user...");
        
        // Small delay to ensure previous step completed fully
        try { Thread.sleep(2000); } catch (InterruptedException e) { }
        
        // Navigate back to login page
        driver.get(PLAYGROUND_URL);

        // Wait for page to fully load
        try { Thread.sleep(2000); } catch (InterruptedException e) { }
        System.out.println("Current URL: " + driver.getCurrentUrl());
        System.out.println("Page title: " + driver.getTitle());
        
        // Wait for and fill username field
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("username")))
            .sendKeys(inbox.getEmailAddress());
        driver.findElement(By.name("password")).sendKeys(TEST_PASSWORD);
        
        System.out.println("Clicking sign-in button...");
        driver.findElement(By.cssSelector("[data-test=sign-in-sign-in-button]")).click();

        // Small delay after clicking login
        try { Thread.sleep(3000); } catch (InterruptedException e) { }
        System.out.println("After login - Current URL: " + driver.getCurrentUrl());
        
        // Wait for authentication and page to load
        WebDriverWait longWait = new WebDriverWait(driver, Duration.ofSeconds(30));
        
        // Wait for either h1 with Welcome or the page body to contain Welcome
        try {
            String h1Text = longWait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")))
                .getText();
            System.out.println("Found h1: " + h1Text);
            assertTrue("Page should display 'Welcome' after login", h1Text.contains("Welcome"));
            System.out.println("SUCCESS: Logged in and found welcome message: " + h1Text);
        } catch (Exception e) {
            // If h1 not found, check body text
            String bodyText = driver.findElement(By.tagName("body")).getText();
            System.out.println("Body text (first 500 chars): " + bodyText.substring(0, Math.min(500, bodyText.length())));
            assertTrue("Page should display 'Welcome' after login", bodyText.contains("Welcome"));
            System.out.println("SUCCESS: Found welcome in body text");
        }
    }

    /**
     * Cleanup: close browser
     */
    @AfterClass
    public static void afterAll() {
        if (driver != null) {
            driver.quit();
        }
    }
}
