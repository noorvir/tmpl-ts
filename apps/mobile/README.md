# Mobile App (SwiftUI)

A native iOS app. Android is not part of this template.

- `Sources/AppFeature` - Views and code, in a Swift package. `swift build` compiles it with no Xcode.
- `ios/App.xcodeproj` - The iOS app target. It needs Xcode.

```bash
open ios/App.xcodeproj
pnpm build:ios   # Build for the simulator
```
<!-- @module api -->

## API

`Sources/AppFeature/APIClient.swift` calls the API server. Add each new route of the contract to it. Set `API_URL` in the Xcode scheme to change the server.

Run the tests against a running server:

```bash
API_URL=http://127.0.0.1:3001 swift test
```
<!-- @end-module -->
