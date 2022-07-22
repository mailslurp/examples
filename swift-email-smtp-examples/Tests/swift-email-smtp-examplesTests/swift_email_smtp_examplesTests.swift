import XCTest
import mailslurp

import class Foundation.Bundle

final class swift_email_smtp_examplesTests: XCTestCase {


        func testSmtpEmailSending() async throws {
        let apiKey = ProcessInfo.processInfo.environment["API_KEY"]
        XCTAssertNotNil(apiKey)
        XCTAssertGreaterThan(apiKey?.count ?? 0, 0, "Expecting API_KEY environment variable to be set and not empty.")

        let ex = self.expectation(description: "Can create inbox")
            DispatchQueue.main.async{

                let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
                InboxControllerAPI.createInboxWithDefaultsWithRequestBuilder()
                        .addHeader(name: "x-api-key", value: apiKey)
                        .execute()
                        .done { response in
                            XCTAssertTrue(response.statusCode == 201)
                            XCTAssertTrue(response.body?.emailAddress?.contains("@mailslurp") ?? false)
                            expectation.fulfill()
                        }.catch { errorType in
                            XCTAssertFalse(true, "Should not throw exception")
                        }
                waitForExpectations(timeout: 5, handler: nil)

    }
}
