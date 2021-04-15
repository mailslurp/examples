package com.mailslurp.examples

import com.mailslurp.apis.InboxControllerApi
import com.mailslurp.apis.WaitForControllerApi
import com.mailslurp.models.SendEmailOptions
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class MailSlurpKotlinTest {

  private val apiKey: String by lazy { System.getenv("API_KEY") }

  @Test
  fun `can create inboxes`() {
    val inboxController = InboxControllerApi(apiKey)
    val inbox = inboxController.createInbox(null, null, null, null, null, null, null, null, null)
    assertTrue(inbox.emailAddress?.contains("@mailslurp") ?: false)
  }

  @Test
  fun `can send and receive email`() {
    // create inbox
    val inboxController = InboxControllerApi(apiKey)
    val waitForController = WaitForControllerApi(apiKey)
    val inbox = inboxController.createInbox(null, null, null, null, null, null, null, null, null)

    val testSubject = "test-subject"
    val confirmation = inboxController.sendEmailAndConfirm(
      inboxId = inbox.id!!,
      sendEmailOptions = SendEmailOptions(
        to = listOf(inbox.emailAddress!!),
        subject = testSubject
      )
    )
    assertEquals(confirmation.inboxId, inbox.id)

    val email = waitForController.waitForLatestEmail(
      inboxId = inbox.id!!,
      timeout = 60_000,
      unreadOnly = true
    )
    assertTrue(email.subject == "test-subject")
  }
}
