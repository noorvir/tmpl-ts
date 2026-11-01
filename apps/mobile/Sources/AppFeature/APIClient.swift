import Foundation

public struct Health: Decodable, Sendable {
    public let status: String
    public let timestamp: String
}

public struct Greeting: Decodable, Sendable {
    public let message: String
}

public enum APIError: Error {
    case status(Int)
}

/// Calls the routes in the API contract, which the server publishes at `/openapi.json`.
public struct APIClient: Sendable {
    private let url: URL

    public init(url: URL) {
        self.url = url
    }

    /// Reads `API_URL`. A physical device needs the IP address of your computer in it.
    public static func fromEnvironment() -> APIClient {
        let value = ProcessInfo.processInfo.environment["API_URL"]
        return APIClient(url: URL(string: value ?? "http://localhost:3001")!)
    }

    public func checkHealth() async throws -> Health {
        let request = URLRequest(url: url.appending(path: "health"))
        return try await send(request)
    }

    public func createGreeting(name: String) async throws -> Greeting {
        var request = URLRequest(url: url.appending(path: "greeting"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try JSONEncoder().encode(["name": name])
        return try await send(request)
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await URLSession.shared.data(for: request)

        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw APIError.status(http.statusCode)
        }

        return try JSONDecoder().decode(Response.self, from: data)
    }
}
