
package dev.mailslurp.examples

import io.appium.java_client.android.AndroidDriver
import io.appium.java_client.android.options.UiAutomator2Options
import org.junit.Before
import org.junit.After
import org.junit.Assert.*
import org.junit.Test
import java.time.Duration
import com.mailslurp.clients.ApiClient
import com.mailslurp.apis.*
import com.mailslurp.models.*
import io.appium.java_client.AppiumBy
import java.net.URL
import java.io.File


class AppiumEmailSignupTest {
    //<gen>android_appium_0_setup
    private lateinit var driver: AndroidDriver

    @Before
    fun setup() {
        val opts = UiAutomator2Options().apply {
            // install the debug APK before starting the session
            val projectRoot = File(System.getProperty("user.dir"))
            val apkFile = File(projectRoot, "build/outputs/apk/debug/app-debug.apk")
            require(apkFile.exists()) {
              "APK not found at ${apkFile.absolutePath}, run `./gradlew assembleDebug` first."
            }
            setApp(apkFile.absolutePath)
            setDeviceName("Android Emulator")
            setPlatformName("Android")
            setAutomationName("UiAutomator2")
            setAppPackage("dev.mailslurp.examples")
            setAppActivity("dev.mailslurp.examples.EntryChoiceActivity")
            setNoReset(true)
            setNewCommandTimeout(Duration.ofSeconds(300))
        }
        driver = AndroidDriver(URL("http://127.0.0.1:4723/wd/hub"), opts)
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10))
    }
    //</gen>

    @Test
    fun appiumSignupTest() {
        val MAILSLURP_API_KEY = System.getenv("API_KEY") ?: System.getProperty("API_KEY")
        assertNotNull("API_KEY is null", MAILSLURP_API_KEY)
        
        //<gen>android_appium_1_open_app
        // open the app wait to load
        driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/item_launch_button"))
            .click()
        //</gen>
        Thread.sleep(3000)

        // 2. Tap the third item in the list
        driver.findElements(
            AppiumBy.xpath("//android.widget.ListView[@resource-id='dev.mailslurp.examples:id/listView']/*")
        )[2].click()

        //<gen>android_appium_2_create_inbox
        // create a disposable email account
        val mailSlurpConfig = ApiClient().apply {
            setApiKey(MAILSLURP_API_KEY!!)
            readTimeout = 120_000
            writeTimeout = 120_000
            connectTimeout = 120_000
        }
        val inboxCtrl = InboxControllerApi(mailSlurpConfig)
        val inbox = inboxCtrl.createInboxWithOptions(CreateInboxDto().expiresIn(300_000)).execute()
        val testEmail = inbox.emailAddress
        val testPwd = "test-password-${System.currentTimeMillis()}"
        //</gen>

        Thread.sleep(3000)

        //<gen>android_appium_3_fill_signup
        driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/fieldEmail"))
            .sendKeys(testEmail)
        driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/fieldPassword"))
            .sendKeys(testPwd)
        driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/emailCreateAccountButton"))
            .click()
        //</gen>

        Thread.sleep(3000)

        //<gen>android_appium_4_verify_and_wait
        driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/verifyEmailButton"))
            .click()
        val waitCtrl = WaitForControllerApi(mailSlurpConfig)
        val email = waitCtrl.waitForLatestEmail()
            .inboxId(inbox.id)
            .timeout(120_000)
            .unreadOnly(true)
            .execute()
        assertTrue(email.subject!!.contains("Verify your email"))
        //</gen>

        //<gen>android_appium_5_open_link
        // get links in email
        val link = EmailControllerApi(mailSlurpConfig)
            .getEmailLinks(email.id)
            .execute()
            .links.first()

        // open the verification link in Chrome via mobile deep link
        @Suppress("UNCHECKED_CAST")
        driver.executeScript(
          "mobile: deepLink",
          mapOf(
            "url" to link,
            "package" to "com.android.chrome",
            "newTask" to true
          )
        )

        // wait for JS to load
        Thread.sleep(5_000)
        // then go back to app
        driver.activateApp("dev.mailslurp.examples")
        //</gen>

        Thread.sleep(1_000)
        //<gen>android_appium_6_verify_user
        val status = driver.findElement(AppiumBy.id("dev.mailslurp.examples:id/status"))
            .text
        assertEquals("Email User: $testEmail (verified: true)", status)
        //</gen>
    }

    @After
    fun teardown() {
        if (::driver.isInitialized) driver.quit()
    }
}