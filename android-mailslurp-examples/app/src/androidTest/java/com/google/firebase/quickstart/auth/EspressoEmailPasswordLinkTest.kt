package com.google.firebase.quickstart.auth


import android.view.View
import android.view.ViewGroup
import androidx.test.espresso.Espresso.onData
import androidx.test.espresso.Espresso.onView
import android.content.Intent
import android.net.Uri
import androidx.test.uiautomator.UiDevice
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
//<gen>android_espressoauth_imports
import com.mailslurp.clients.ApiClient
import com.mailslurp.apis.*
import com.mailslurp.models.*
//</gen>
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.anything
import org.hamcrest.Matchers.`is`
import org.hamcrest.TypeSafeMatcher
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@LargeTest
@RunWith(AndroidJUnit4::class)
class EspressoEmailPasswordLinkTest {

    @Rule
    @JvmField
    var mActivityScenarioRule = ActivityScenarioRule(EntryChoiceActivity::class.java)

    @Test
    fun espressoEmailPasswordLinkTest() {
        val materialButton = onView(
            allOf(
                withId(com.firebase.example.internal.R.id.item_launch_button), withText("Open"),
                childAtPosition(
                    childAtPosition(
                        withClassName(`is`("com.google.android.material.card.MaterialCardView")),
                        0
                    ),
                    2
                ),
                isDisplayed()
            )
        )
        materialButton.perform(click())

        val twoLineListItem = onData(anything())
            .inAdapterView(
                allOf(
                    withId(R.id.listView),
                    childAtPosition(
                        withClassName(`is`("android.widget.FrameLayout")),
                        0
                    )
                )
            )
            .atPosition(2)
        twoLineListItem.perform(click())

        //<gen>android_espressoauth_1_read_apikey
        val YOUR_MAILSLURP_API_KEY = InstrumentationRegistry
            .getArguments()
            .getString("API_KEY")
        //</gen>
        assertThat(YOUR_MAILSLURP_API_KEY, Matchers.notNullValue())
        val TIMEOUT_MILLIS = 120_000

        //<gen>android_espressoauth_2_setup_config
        val apiClient = ApiClient().apply {
            // set MailSlurp API KEY
            setApiKey(YOUR_MAILSLURP_API_KEY)
            // set generous timeouts
            readTimeout = TIMEOUT_MILLIS
            writeTimeout = TIMEOUT_MILLIS
            connectTimeout = TIMEOUT_MILLIS
        }
        //</gen>
        //<gen>android_espressoauth_3_create_inbox
        // create a temporary inbox
        val inboxController = InboxControllerApi(apiClient)
        val inbox =
            inboxController.createInboxWithOptions(
                CreateInboxDto()
                    .expiresIn(300_000)
            ).execute()
        val testEmail = inbox.emailAddress
        val testPassword = "test-password-${System.currentTimeMillis()}"
        //</gen>
        Thread.sleep(1000)
        //<gen>android_espressoauth_4_fill_inputs
        // find email and password input
        val emailInput = onView(
            allOf(
                withId(R.id.fieldEmail),
                childAtPosition(
                    childAtPosition(
                        withId(R.id.main_layout),
                        2
                    ),
                    1
                ),
                isDisplayed()
            )
        )
        val passwordInput = onView(
            allOf(
                withId(R.id.fieldPassword),
                childAtPosition(
                    childAtPosition(
                        withId(R.id.main_layout),
                        2
                    ),
                    2
                ),
                isDisplayed()
            )
        )
        // use test email and password to fill sign-up form
        emailInput.perform(replaceText(inbox.emailAddress), closeSoftKeyboard())
        passwordInput.perform(replaceText(testPassword), closeSoftKeyboard())
        onView(
            allOf(
                withId(R.id.emailCreateAccountButton),
                isDisplayed()
            )
        ).perform(click())
        //</gen>
        Thread.sleep(3000)
        onView(
            allOf(
                withId(R.id.verifyEmailButton),
                isDisplayed()
            )
        ).perform(click())

        //<gen>android_espressoauth_5_get_link
        // wait for the confirmation email to arrive in the inbox
        val waitController = WaitForControllerApi(apiClient)
        val email =
            waitController.waitForLatestEmail()
                .inboxId(inbox.id)
                .timeout(TIMEOUT_MILLIS.toLong())
                .unreadOnly(true)
                .execute()
        assertThat(email.subject, Matchers.containsString("Verify your email"))

        // now extract the links in the email
        val emailController = EmailControllerApi(apiClient)
        val emailLinkQuery = emailController.getEmailLinks(email.id).execute()
        val verificationLink = emailLinkQuery.links.first()
        //</gen>

        //<gen>android_espressoauth_6_get_link
        // launch browser to open link and verify email
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(verificationLink)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        // wait a moment for Chrome to come up and load the page
        Thread.sleep(5000)
        device.pressBack()
        //</gen>
        Thread.sleep(2000)
        //<gen>android_espressoauth_7_check_status
        val textView = onView(
            allOf(
                withId(R.id.status),
                withParent(withParent(withId(R.id.main_layout))),
                isDisplayed()
            )
        )
        textView.check(matches(withText("Email User: ${testEmail} (verified: true)")))
        //</gen>
    }

    private fun childAtPosition(
        parentMatcher: Matcher<View>, position: Int
    ): Matcher<View> {

        return object : TypeSafeMatcher<View>() {
            override fun describeTo(description: Description) {
                description.appendText("Child at position $position in parent ")
                parentMatcher.describeTo(description)
            }

            public override fun matchesSafely(view: View): Boolean {
                val parent = view.parent
                return parent is ViewGroup && parentMatcher.matches(parent)
                        && view == parent.getChildAt(position)
            }
        }
    }
}
