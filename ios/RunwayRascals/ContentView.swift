import SwiftUI

struct ContentView: View {
    var body: some View {
        GameWebView(url: AppConfig.gameURL)
            .ignoresSafeArea()
            .background(Color.black.ignoresSafeArea())
    }
}

#Preview {
    ContentView()
}
