import Foundation

enum AppConfig {
    /// Production web build. Override in Debug via scheme env `RUNWAY_URL` if needed.
    static var gameURL: URL {
        #if DEBUG
        if let override = ProcessInfo.processInfo.environment["RUNWAY_URL"],
           let url = URL(string: override) {
            return url
        }
        // Local static server while developing the web shell
        if let local = URL(string: "http://127.0.0.1:4173/index.html") {
            return local
        }
        #endif
        return URL(string: "https://runnwayrascals.vercel.app/")!
    }

    static let bundleDisplayName = "Runway Rascals"
}
