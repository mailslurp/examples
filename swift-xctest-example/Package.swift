// swift-tools-version:6.1
import PackageDescription

let package = Package(
    name: "swift-xctest-example",
    products: [
        .library(
            name: "swift-xctest-example",
            targets: ["swift-xctest-example"]
        ),
    ],
    dependencies: [
        // MailSlurp Swift client v16.1.5+
        .package(
          url: "https://github.com/mailslurp/mailslurp-client-swift.git",
          from: "16.1.5"
        ),
    ],
    targets: [
        .target(
            name: "swift-xctest-example",
            dependencies: [
              .product(name: "mailslurp", package: "mailslurp-client-swift")
            ]
        ),
        .testTarget(
            name: "swift-xctest-exampleTests",
            dependencies: ["swift-xctest-example"]
        ),
    ]
)
