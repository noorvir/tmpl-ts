// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AppFeature",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [
        .library(name: "AppFeature", targets: ["AppFeature"]),
    ],
    targets: [
        .target(name: "AppFeature"),
        // @module api
        .testTarget(name: "AppFeatureTests", dependencies: ["AppFeature"]),
        // @end-module
    ]
)
