import WidgetKit
import SwiftUI

// MARK: - Shared Data
struct WidgetData: Codable {
    var message: String
    var lastUpdated: Date
    
    static let defaultData = WidgetData(message: "Hello from MyApp!", lastUpdated: Date())
    
    static func load() -> WidgetData {
        let defaults = UserDefaults(suiteName: "group.com.yourcompany.myapp")
        
        if let data = defaults?.data(forKey: "widgetData"),
           let decoded = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return decoded
        }
        
        return defaultData
    }
}

