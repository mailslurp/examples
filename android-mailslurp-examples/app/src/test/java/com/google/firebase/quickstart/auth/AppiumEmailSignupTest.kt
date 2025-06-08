package com.google.firebase.quickstart.auth

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
    private lateinit var driver: AndroidDriver
    private lateinit var apiClient: ApiClient

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
            setAppPackage("com.google.firebase.quickstart.auth")
            setAppActivity("com.google.firebase.quickstart.auth.EntryChoiceActivity")
            setNoReset(true)
            setNewCommandTimeout(Duration.ofSeconds(300))
        }
        driver = AndroidDriver(URL("http://127.0.0.1:4723/wd/hub"), opts)
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10))

        // MailSlurp API client
        val key = System.getenv("API_KEY") ?: System.getProperty("API_KEY")
        assertNotNull("API_KEY is null", key)
        apiClient = ApiClient().apply {
            setApiKey(key!!)
            readTimeout = 120_000
            writeTimeout = 120_000
            connectTimeout = 120_000
        }
    }

    @Test
    fun appiumSignupTest() {
        // 1. Tap "Open"
        driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/item_launch_button"))
            .click()

        // 2. Tap the third item in the list
        driver.findElements(
            AppiumBy.xpath("//android.widget.ListView[@resource-id='com.google.firebase.quickstart.auth:id/listView']/*")
        )[2].click()

        // 3. Create inbox
        val inboxCtrl = InboxControllerApi(apiClient)
        val inbox = inboxCtrl.createInboxWithOptions(CreateInboxDto().expiresIn(300_000)).execute()
        val testEmail = inbox.emailAddress
        val testPwd = "test-password-${System.currentTimeMillis()}"

        // 4. Fill signup form
        driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/fieldEmail"))
            .sendKeys(testEmail)
        driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/fieldPassword"))
            .sendKeys(testPwd)
        driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/emailCreateAccountButton"))
            .click()

        // 5. Verify button appears and tap it
        driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/verifyEmailButton"))
            .click()

        // 6. Wait for MailSlurp link
        val waitCtrl = WaitForControllerApi(apiClient)
        val email = waitCtrl.waitForLatestEmail()
            .inboxId(inbox.id)
            .timeout(120_000)
            .unreadOnly(true)
            .execute()
        assertTrue(email.subject!!.contains("Verify your email"))

        val link = EmailControllerApi(apiClient)
            .getEmailLinks(email.id)
            .execute()
            .links.first()

        // 7. Open link in Chrome, then back to app
        driver.activateApp("com.android.chrome")
        driver.get(link)
        Thread.sleep(5_000)
        driver.activateApp("com.google.firebase.quickstart.auth")

        // 8. Check status text
        val status = driver.findElement(AppiumBy.id("com.google.firebase.quickstart.auth:id/status"))
            .text
        assertEquals("Email User: $testEmail (verified: true)", status)
    }

    @After
    fun teardown() {
        if (::driver.isInitialized) driver.quit()
    }
}