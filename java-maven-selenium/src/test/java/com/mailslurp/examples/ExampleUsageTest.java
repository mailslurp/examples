package com.mailslurp.examples;

import com.mailslurp.client.ApiClient;
import com.mailslurp.client.Configuration;
import java.io.File;
import java.util.concurrent.TimeUnit;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class ExampleUsageTest {

    private final static String WEBDRIVER_PATH = System.getenv("PATH_TO_WEBDRIVER");
    private final static String YOUR_API_KEY = System.getenv("API_KEY");

    private static final Boolean UNREAD_ONLY = true;
    private static final Long TIMEOUT_MILLIS = 30000L;

    private static ApiClient mailslurpClient;
    private static WebDriver driver;

    @BeforeClass
    public static void beforeAll() {
        assertNotNull(YOUR_API_KEY);
        assertNotNull(WEBDRIVER_PATH);

        // setup mailslurp
        mailslurpClient = Configuration.getDefaultApiClient();
        mailslurpClient.setApiKey(YOUR_API_KEY);

        // setup chrome driver (expects chromedriver binary at path)
        assertTrue(new File(WEBDRIVER_PATH).exists());
        System.setProperty("webdriver.gecko.driver", WEBDRIVER_PATH);
        driver = new FirefoxDriver();
        driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void afterAll() {
        driver.close();
    }

    @Test
    public void test() {
        assertEquals(0, 0);
    }

}
