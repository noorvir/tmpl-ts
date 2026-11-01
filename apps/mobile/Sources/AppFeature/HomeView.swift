import SwiftUI

public struct HomeView: View {
    public init() {}

    public var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("A fresh SwiftUI app")
                    .font(.title)
                // @module api
                APIStatusView()
                // @end-module
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

// @module api
struct APIStatusView: View {
    private enum Status: String {
        case checking = "Checking API…"
        case online = "API online"
        case offline = "API offline"
    }

    @State private var status = Status.checking

    var body: some View {
        Text(status.rawValue)
            .foregroundStyle(.secondary)
            .task {
                status = await readStatus()
            }
    }

    private func readStatus() async -> Status {
        do {
            _ = try await APIClient.fromEnvironment().checkHealth()
            return .online
        } catch {
            return .offline
        }
    }
}
// @end-module
