package com.smoketest.selenium;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

/**
 * Browser Helper for Selenium operations in MuleSoft flows.
 * 
 * This class provides simplified browser automation methods that can be
 * invoked from Mule flows using the Java Module. It handles:
 * - Browser initialization and cleanup
 * - Signup form interaction
 * - OTP code entry and verification
 * - Login and welcome assertion
 * 
 * Designed to be instantiated per-flow execution and closed when done.
 */
public class BrowserHelper {

    private static final Logger logger = LoggerFactory.getLogger(BrowserHelper.class);
    private static final String PLAYGROUND_URL = "https://playground.mailslurp.com";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final Duration IMPLICIT_WAIT = Duration.ofSeconds(10);

    private WebDriver driver;
    private WebDriverWait wait;

    /**
     * Default constructor - initializes Chrome WebDriver.
     */
    public BrowserHelper() {
        logger.info("Initializing Chrome WebDriver...");
        
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        // Uncomment for headless mode:
        // options.addArguments("--headless");

        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(IMPLICIT_WAIT);
        wait = new WebDriverWait(driver, TIMEOUT);
        
        logger.info("Chrome WebDriver initialized successfully");
    }

    /**
     * Opens the playground site and fills in the signup form.
     * 
     * Steps:
     * 1. Navigate to playground.mailslurp.com
     * 2. Click "Create Account" link
     * 3. Fill email and password fields
     * 4. Submit the signup form
     * 
     * @param emailAddress The email address to use for signup
     * @param password The password to use for signup
     * @return true if signup form was submitted successfully
     */
    public boolean openAndSignup(String emailAddress, String password) {
        logger.info("Opening playground and starting signup with email: {}", emailAddress);
        
        try {
            // Navigate to playground
            driver.get(PLAYGROUND_URL);
            logger.info("Loaded playground: {}", driver.getTitle());

            // Click "Create Account" link
            wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("[data-test=sign-in-create-account-link]"))).click();
            logger.info("Clicked 'Create Account' link");

            // Fill signup form
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")))
                .sendKeys(emailAddress);
            driver.findElement(By.name("password")).sendKeys(password);
            logger.info("Filled signup form");

            // Submit signup
            driver.findElement(By.cssSelector("[data-test=sign-up-create-account-button]")).click();
            logger.info("Submitted signup form");

            return true;
        } catch (Exception e) {
            logger.error("Signup failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to complete signup: " + e.getMessage(), e);
        }
    }

    /**
     * Enters the OTP code, confirms signup, then logs in and verifies welcome message.
     * 
     * Steps:
     * 1. Enter the 6-digit OTP code
     * 2. Confirm signup
     * 3. Navigate back to login page
     * 4. Login with credentials
     * 5. Assert "Welcome" text appears
     * 
     * @param code The 6-digit OTP verification code
     * @param emailAddress The email address to use for login
     * @param password The password to use for login
     * @return true if login successful and welcome message found
     */
    public boolean enterCodeAndLogin(String code, String emailAddress, String password) {
        logger.info("Entering OTP code: {}", code);
        
        try {
            // Enter verification code
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("code")))
                .sendKeys(code);
            driver.findElement(By.cssSelector("[data-test=confirm-sign-up-confirm-button]")).click();
            logger.info("Submitted verification code");

            // Wait for confirmation to complete
            Thread.sleep(2000);

            // Navigate back to login page
            driver.get(PLAYGROUND_URL);
            Thread.sleep(2000);
            logger.info("Navigated back to login page");

            // Fill login form
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("username")))
                .sendKeys(emailAddress);
            driver.findElement(By.name("password")).sendKeys(password);
            logger.info("Filled login form");

            // Click sign in
            driver.findElement(By.cssSelector("[data-test=sign-in-sign-in-button]")).click();
            logger.info("Clicked sign in button");

            // Wait for login to complete
            Thread.sleep(3000);

            // Verify welcome message
            WebDriverWait longWait = new WebDriverWait(driver, Duration.ofSeconds(30));
            
            try {
                String h1Text = longWait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")))
                    .getText();
                logger.info("Found h1 text: {}", h1Text);
                
                if (!h1Text.contains("Welcome")) {
                    throw new AssertionError("Expected 'Welcome' in h1, but found: " + h1Text);
                }
                logger.info("SUCCESS: Welcome message verified!");
                return true;
            } catch (Exception e) {
                // Fallback: check body text
                String bodyText = driver.findElement(By.tagName("body")).getText();
                if (bodyText.contains("Welcome")) {
                    logger.info("SUCCESS: Found 'Welcome' in body text");
                    return true;
                }
                throw new AssertionError("Welcome message not found on page");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Test interrupted", e);
        } catch (Exception e) {
            logger.error("Login/verification failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to complete login verification: " + e.getMessage(), e);
        }
    }

    /**
     * Closes the browser and releases resources.
     * Should be called after test completion (success or failure).
     */
    public void closeBrowser() {
        if (driver != null) {
            logger.info("Closing browser...");
            try {
                driver.quit();
                logger.info("Browser closed successfully");
            } catch (Exception e) {
                logger.warn("Error closing browser: {}", e.getMessage());
            } finally {
                driver = null;
                wait = null;
            }
        }
    }
}
