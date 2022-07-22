// swift-tools-version:5.5

import PackageDescription

let package = Package(
        name: "swift-email-smtp-examples",
        products: [
        ],
        dependencies: [
            .package(url: "https://github.com/mailslurp/mailslurp-client-swift", revision: "15.12.9"),
        ],
        targets: [
            .testTarget(
                    name: "swift-email-smtp-examplesTests",
                    dependencies: [
                        .product(name: "mailslurp", package: "mailslurp-client-swift"),
                    ]),
        ]
)
