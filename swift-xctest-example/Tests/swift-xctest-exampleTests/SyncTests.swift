import XCTest
import mailslurp
import Dispatch
@testable import swift_xctest_example

final class SyncTests: XCTestCase {
    func testCreateInboxAsync() async throws {
        let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
        XCTAssertFalse(apiKey.isEmpty, "set API_KEY environment variable to run this test")

        let builder = InboxControllerAPI
            .createInboxWithDefaultsWithRequestBuilder()
            .addHeader(name: "x-api-key", value: apiKey)

        // Await only the email string to satisfy Sendable constraints
        let email: String = try await withCheckedThrowingContinuation { continuation in
            builder.execute { result in
                switch result {
                case .success(let response):
                    let emailAddress = response.body.emailAddress
                    continuation.resume(returning: emailAddress)
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
        }

        XCTAssertTrue(email.contains("@mailslurp"), "Email address \(email) does not contain @mailslurp")
    }
}
