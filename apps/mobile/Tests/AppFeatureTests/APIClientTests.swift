import Foundation
import Testing

@testable import AppFeature

private let serverIsRunning = ProcessInfo.processInfo.environment["API_URL"] != nil

/// These tests call a running API server. Set `API_URL` to run them.
@Suite(.enabled(if: serverIsRunning))
struct APIClientTests {
    let api = APIClient.fromEnvironment()

    @Test func readsHealth() async throws {
        let health = try await api.checkHealth()

        #expect(health.status == "ok")
    }

    @Test func createsGreeting() async throws {
        let greeting = try await api.createGreeting(name: "Ada")

        #expect(greeting.message == "Hello, Ada")
    }

    @Test func serverRejectsInvalidInput() async {
        await #expect(throws: APIError.self) {
            try await api.createGreeting(name: "")
        }
    }
}
