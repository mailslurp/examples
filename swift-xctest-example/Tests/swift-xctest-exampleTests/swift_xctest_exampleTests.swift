import Testing
import Foundation
@testable import swift_xctest_example
//<gen>swift_xctest_import
import mailslurp
import PromiseKit
//</gen>

@Test
func example() async throws {
    let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
    #expect(!apiKey.isEmpty, "set API_KEY environment variable to run this test")


    //<gen>swift_xctest_config
    let config = mailslurpAPIConfiguration(
        customHeaders: [
            "x-api-key": apiKey
        ]
    )
    //</gen>

    //<gen>swift_xctest_create_inbox
    let inbox = try await InboxControllerAPI
        .createInboxWithDefaults(apiConfiguration: config)
        .async()
    //</gen>
    #expect(inbox.emailAddress.contains("@"), "Has valid email address")

    //<gen>swift_xctest_send_email
    let sendOpts = SendEmailOptions(
        to: [inbox.emailAddress],
        subject: "Test email",
        body: "Hello"
    )
    _ = try await InboxControllerAPI.sendEmailAndConfirm(inboxId: inbox._id, sendEmailOptions: sendOpts, apiConfiguration:  config)
        .async()
    //</gen>

    
    //    // send email to itself
//    _ = try await InboxControllerAPI
//        .sendEmail(inboxId: inbox.id, to: [inbox.emailAddress], subject: "Test", body: "Hello")
//        .get()
//
//    // wait for the latest email
//    let email = try await WaitForControllerAPI
//        .waitForLatestEmail(inboxId: inbox.id, timeout: 30000)
//        .get()
//    #expect(email.subject == "Test", "Expected subject 'Test', got \(email.subject)")
//    #expect(email.body.contains("Hello"), "Expected body to contain 'Hello', got \(email.body)")
}
