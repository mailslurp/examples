import XCTest
@testable import swift_xctest_example
import mailslurp

final class SyncTests: XCTestCase {
  func testBuildInboxRequest() throws {
    let key = ProcessInfo.processInfo.environment["MAILSLURP_API_KEY"] ?? ""
    XCTAssertFalse(key.isEmpty, "set MAILSLURP_API_KEY to run this")
    let builder = InboxControllerAPI
      .createInboxWithDefaultsWithRequestBuilder()
      .addHeader(name: "x-api-key", value: key)
    XCTAssertNotNil(builder)
  }
}
