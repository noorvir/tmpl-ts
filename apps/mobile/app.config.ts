import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "myapp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.myapp",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "This app needs location access to show your current position.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.yourcompany.myapp",
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "This app needs location access to show your current position.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});

