# MailSlurp Swift Email Client

Send and receive emails in Swift and Objective C. Use the MailSlurp Swift client for managing email accounts in iOS, MacOS, TVOS, and more. Built with OpenAPI and PromiseKit.

## Quick links

- [API documentation](https://docs.mailslurp.com/api/)
- [Swift getting started guide](https://www.mailslurp.com/examples/)
- [SwiftPackageIndex](https://swiftpackageindex.com/mailslurp/mailslurp-client-swift)
- [Github Source](https://github.com/mailslurp/mailslurp-client-swift/)
- [Method Documentation](https://github.com/mailslurp/mailslurp-client-swift/tree/master/docs/)
- [iOS XCode setup example](https://www.mailslurp.com/examples/ios-xcode-send-and-read-email-example/)
- [Support](https://www.mailslurp.com/support/)

## Install MailSlurp package
The Swift package is hosted on the [Swift Package Index](https://swiftpackageindex.com/mailslurp/mailslurp-client-swift) and [GitHub](https://github.com/mailslurp/mailslurp-client-swift). Create a new swift project using:

```bash
swift package init --type=executable
```

Edit `Packages.swift` and add `https://github.com/mailslurp/mailslurp-client-swift` as a package **and** a target dependency.

```swift
// swift-tools-version:5.5

import PackageDescription

let package = Package(
        name: "your-project",
        products: [
        ],
        dependencies: [
            .package(url: "https://github.com/mailslurp/mailslurp-client-swift", from: "15.12.5"),
        ],
        targets: [
            .testTarget(
                    name: "your-test-project",
                    dependencies: [
                        .product(name: "mailslurp", package: "mailslurp-client-swift")
                    ]),
        ]
)
```

MailSlurp client is built with PromiseKit (async/await for swift) so you may also want to include [AwaitKit](https://github.com/yannickl/AwaitKit) in your swift dependencies for awaiting Promise results.

## Setup API Key

MailSlurp is free to use but requires an API Key. [Sign up](https://app.mailslurp.com) and create an API Key using the [MailSlurp dashboard](https://app.mailslurp.com).

When you make requests use an API controller's `withRequestBuilder` method call the `addHeader("x-api-key", "your-api-key")` method to add authentication to your requests. For example when using the InboxController methods:

```swift
let promise = InboxControllerAPI
    .createInboxWithDefaultsWithRequestBuilder()
    .addHeader(name: "x-api-key", value: apiKey)
    .execute()
```

The full test example is as follows:

```swift
let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""
InboxControllerAPI.createInboxWithDefaultsWithRequestBuilder()
    // use addHeader to add your api key to requests
    .addHeader(name: "x-api-key", value: apiKey)
    .execute()
    // uses PromiseKit for response handling
    .done { response in
        XCTAssertTrue(response.body?.emailAddress?.contains("@mailslurp") ?? false)
        XCTAssertTrue(response.statusCode == 201)
        expectation.fulfill()
    }.catch { errorType in 
        // handle error, cast to mailslurp.ErrorResponse using guard to access .error(statusCode, data, _, _)
    }
```

## API structure

The Swift client mimics the [controllers and methods of the REST API](https://docs.mailslurp.com/api/). For controller and method documentation please see the [code hosted on GitHub](https://github.com/mailslurp/mailslurp-client-swift) or read the [getting started guide](https://www.mailslurp.com/guides/getting-started/).

## Platform compatibility

MailSlurp Swift client is built to target Swift 5.x and XCode 12.x.

| Platform | Minimum Version |
|----------|-----------------|
| iOS      | v9              |
| MacOS    | V10.11          |
| TVOS     | v9              |
| WatchOS  | v3              |

## Example usage

MailSlurp uses PromiseKit. To test using XCTest and MailSlurp use the example below:

```swift
import XCTest
import class Foundation.Bundle
import mailslurp

final class exampleTests: XCTestCase {
    func testExample() throws {
        let expectation = self.expectation(description: "Can create inbox")
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

    /// Returns path to the built products directory.
    var productsDirectory: URL {
      #if os(macOS)
        for bundle in Bundle.allBundles where bundle.bundlePath.hasSuffix(".xctest") {
            return bundle.bundleURL.deletingLastPathComponent()
        }
        fatalError("couldn't find the products directory")
      #else
        return Bundle.main.bundleURL
      #endif
    }
}
```

To run the test execute:

```bash
API_KEY=your-api-key swift test
```

### Handling exceptions

Use a guard to cast errors to a `mailslurp.ErrorResponse` to access the status code and error message of a request.

```swift
CommonActionsControllerAPI.sendEmailSimpleWithRequestBuilder(emailOptions: sendOptions)
  .addHeader(name: "x-api-key", value: apiKey)
  .execute()
  .done { response in
    // handle success
  }
  .catch(policy: .allErrors) { err in
    // handle error
    guard let e = err as? mailslurp.ErrorResponse else {
        error = err.localizedDescription
        return
    }
    // pattern match the error to access status code and data
    // MailSlurp returns 4xx errors when invalid parameters or
    // unsatisfiable request. See the message and status code
    switch e {
    case .error(let statusCode, let data, _, _):
        let msg = String(decoding: data!, as: UTF8.self)
        error = "\(statusCode) Bad request: \(msg)"
    }
  }
```

### Awaiting promises

PromiseKit wraps MailSlurp request results in a Promise. Use `.done { response in }` and `.catch { err in }` methods to handle responses and exceptions. For easier access use AwaitKit style await functions.

```swift
let inbox = try! await(
    InboxControllerAPI.createInboxWithDefaultsWithRequestBuilder()
        .addHeader(name: "x-api-key", value: apiKey)
        .execute()
)
// then access inbox.emailAddress, inbox.id etc
```
