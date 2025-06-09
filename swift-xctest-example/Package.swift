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
        //<gen>swift_xctest_dep
        .package(
          url: "https://github.com/mailslurp/mailslurp-client-swift.git",
          from: "16.1.5"
        ),
        //</gen>
    ],
    targets: [
        //<gen>swift_xctest_target
        .target(
            name: "swift-xctest-example",
            dependencies: [
              .product(name: "mailslurp", package: "mailslurp-client-swift")
            ]
        ),
        //</gen>
        .testTarget(
            name: "swift-xctest-exampleTests",
            dependencies: ["swift-xctest-example"]
        ),
    ]
)
