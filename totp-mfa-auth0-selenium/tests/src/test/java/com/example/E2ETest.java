package com.example;

//<gen>totp_selenium_0_imports
import com.mailslurp.apis.InboxControllerApi;
import com.mailslurp.apis.MfaControllerApi;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.CreateInboxDto;
import com.mailslurp.models.CreateTotpDeviceOtpAuthUrlOptions;
//</gen>
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.remote.RemoteWebDriver;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;

import static com.example.util.TestUtils.takeScreenshot;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.openqa.selenium.support.ui.ExpectedConditions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class E2ETest {
    private WebDriver driver;
    private WebDriverWait wait;
    private String MAILSLURP_API_KEY;
    private String APP_URL = "http://localhost:3000";

    @BeforeAll
    void setupDriver() {
        // check API_KEY set for mailslurp
        MAILSLURP_API_KEY = System.getenv("API_KEY");
        assertTrue(MAILSLURP_API_KEY != null && !MAILSLURP_API_KEY.isEmpty(), "MailSlurp API_KEY must be set for tests");

        // Check if APP_URL is reachable before running tests
        try {
            var url = new URL(APP_URL);
            var connection = url.openConnection();
            connection.setConnectTimeout(5000);
            connection.connect();
        } catch (IOException e) {
            throw new RuntimeException("App is not running at " + APP_URL, e);
        }

        // configure WebDriver for Firefox
        WebDriverManager.firefoxdriver().setup();
    }

    @BeforeEach
    void startBrowser() {
        FirefoxOptions opts = new FirefoxOptions();
        driver = new FirefoxDriver(opts);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void teardown() {
        if (driver != null) driver.quit();
    }

    @Test
    void canTestTOTPAuthenticatorLogin() throws ApiException, IOException, InterruptedException {
        //<gen>totp_selenium_01_open_app
        // navigate to our test app that uses Auth0 MFA for authentication
        driver.get(APP_URL);
        String body = wait.until(visibilityOfElementLocated(By.tagName("body"))).getText();
        assertTrue(body.contains("Login"), "Expect home page");
        //</gen>
        takeScreenshot(driver, "totp-selenium-1-app");
        //<gen>totp_selenium_02_click_login
        // click new sign up
        wait.until(elementToBeClickable(By.id("qsLoginBtn"))).click();
        wait.until(elementToBeClickable(By.cssSelector("a[href^='/u/signup']"))).click();
        //</gen>
        takeScreenshot(driver, "totp-selenium-2-signup");

        //<gen>totp_selenium_03_create_inbox
        // setup mailslurp api client
        var apiClient = new ApiClient();
        apiClient.setApiKey(MAILSLURP_API_KEY);

        // create disposable email account
        var inboxController = new InboxControllerApi(apiClient);
        var inbox = inboxController.createInboxWithOptions(new CreateInboxDto().expiresIn(300_000L)).execute();
        String emailAddress = inbox.getEmailAddress();
        String password = "testPassword123!";
        //</gen>

        //<gen>totp_selenium_04_fill_form
        // fill in the sign up form and submit
        wait.until(visibilityOfElementLocated(By.id("email"))).sendKeys(emailAddress);
        wait.until(visibilityOfElementLocated(By.id("password"))).sendKeys(password);
        //<gen-ignore>
        takeScreenshot(driver, "totp-selenium-3-fill");
        //</gen-ignore>
        wait.until(elementToBeClickable(By.cssSelector("button[type='submit']"))).click();
        //</gen>


        //<gen>totp_selenium_05_view_mfa_qr_code
        // expect MFA QR code to be displayed then extract the otpauth:// URI from the QR code
        wait.until(visibilityOfElementLocated(By.cssSelector("[data-qr-data]")));
        String optAuthUrl = driver.findElement(By.cssSelector("[data-qr-data]")).getAttribute("data-qr-data");
        assertTrue(optAuthUrl.startsWith("otpauth://"), "Expect otpauth:// URI in QR code");
        //<gen-ignore>
        Thread.sleep(1_000);
        takeScreenshot(driver, "totp-selenium-4-qr-code");
        //</gen-ignore>
        //</gen>

        //<gen>totp_selenium_06_create_totp_device
        // next create a TOTP authenticator device in MailSlurp
        var mfaController = new MfaControllerApi(apiClient);
        var virtualTotpDevice = mfaController.createTotpDeviceForOtpAuthUrl(new CreateTotpDeviceOtpAuthUrlOptions()
                // pass the QR code otpauth:// URI to MailSlurp
                .otpAuthUrl(optAuthUrl)
        ).execute();
        //</gen>

        //<gen>totp_selenium_07_submit_totp_code
        // now generate a secret code from the TOTP device and submit it
        var oneTimeCode = mfaController.getTotpDeviceCode(virtualTotpDevice.getId())
                // ensure code is valid long enough to be entered by selenium
                .minSecondsUntilExpire(10)
                .execute().getCode();
        wait.until(visibilityOfElementLocated(By.id("code"))).sendKeys(oneTimeCode);
        //<gen-ignore>
        Thread.sleep(1_000);
        takeScreenshot(driver, "totp-selenium-5-submit-code");
        //</gen-ignore>
        // submit the code
        wait.until(elementToBeClickable(By.cssSelector("button[data-action-button-primary=\"true\"]"))).click();
        //<gen-ignore>
        // accept the authorization request
        Thread.sleep(1_000);
        takeScreenshot(driver, "totp-selenium-6-accept-authorization");
        //</gen-ignore>
        wait.until(elementToBeClickable(By.cssSelector("button[name='action'][value='accept']"))).click();
        //</gen>

        //<gen>totp_selenium_08_logged_in
        // expect login home page and email address in the profile dropdown
        wait.until(elementToBeClickable(By.id("profileDropDown"))).click();
        wait.until(visibilityOfElementLocated(By.cssSelector("#profileDropDown + .dropdown-menu")));
        String dropdownText = driver.findElement(By.cssSelector("#profileDropDown + .dropdown-menu")).getText();
        //<gen-ignore>
        Thread.sleep(1_000);
        takeScreenshot(driver, "totp-selenium-7-logged-in");
        //</gen-ignore>
        assertTrue(dropdownText.contains(emailAddress), "Dropdown menu should contain the email address");
        //</gen>

        //<gen>totp_selenium_09_logout_and_relogin
        // click logout
        wait.until(elementToBeClickable(By.id("qsLogoutBtn"))).click();
        // then try login again
        wait.until(elementToBeClickable(By.id("qsLoginBtn"))).click();
        wait.until(visibilityOfElementLocated(By.id("username"))).sendKeys(emailAddress);
        wait.until(visibilityOfElementLocated(By.id("password"))).sendKeys(password);
        wait.until(elementToBeClickable(By.cssSelector("button[data-action-button-primary=\"true\"]"))).click();
        // expect to see MFA code entry field again after login
        wait.until(visibilityOfElementLocated(By.id("code")));
        //</gen>

        //<gen>totp_selenium_10_generate_second_code
        // get another TOTP code from the same device and submit it to complete login
        var oneTimeCode2 = mfaController.getTotpDeviceCode(virtualTotpDevice.getId())
                .minSecondsUntilExpire(10)
                .execute().getCode();
        wait.until(visibilityOfElementLocated(By.id("code"))).sendKeys(oneTimeCode2);
        wait.until(elementToBeClickable(By.cssSelector("button[data-action-button-primary=\"true\"]"))).click();
        // expect logged in screen again
        wait.until(elementToBeClickable(By.id("profileDropDown"))).click();
        wait.until(visibilityOfElementLocated(By.cssSelector("#profileDropDown + .dropdown-menu")));
        String dropdownText2 = driver.findElement(By.cssSelector("#profileDropDown + .dropdown-menu")).getText();
        assertTrue(dropdownText2.contains(emailAddress), "Dropdown menu should contain the email address");
        //</gen>
    }
}
