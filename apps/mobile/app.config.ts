import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "myapp",
  scheme: "myapp",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon-light.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  newArchEnabled: true,
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.yourcompany.myapp",
    supportsTablet: true,
    icon: {
      light: "./assets/icon-light.png",
      dark: "./assets/icon-dark.png",
    },
    infoPlist: {
      NSCameraUsageDescription:
        "This app uses the camera to take photos and scan documents.",
      NSPhotoLibraryUsageDescription:
        "This app accesses your photo library to select images.",
      NSLocationWhenInUseUsageDescription:
        "This app uses your location to show nearby places and provide location-based features.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "This app uses your location in the background to track your activity.",
    },
  },
  android: {
    package: "com.yourcompany.myapp",
    adaptiveIcon: {
      foregroundImage: "./assets/icon-light.png",
      backgroundColor: "#1F104A",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
    ],
  },
  // extra: {
  //   eas: {
  //     projectId: "your-eas-project-id",
  //   },
  // },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-camera",
      {
        cameraPermission:
          "This app uses the camera to take photos and scan documents.",
        microphonePermission:
          "This app uses the microphone to record audio with video.",
        recordAudioAndroid: true,
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "This app uses your location to show nearby places.",
        locationAlwaysPermission:
          "This app uses your location in the background.",
        locationWhenInUsePermission:
          "This app uses your location to show nearby places.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "This app accesses your photos to let you share images.",
      },
    ],
    // Widgets disabled for now - requires Apple Developer Team ID and Swift version alignment
    // [
    //   "@bittingz/expo-widgets",
    //   {
    //     ios: {
    //       src: "./widgets/ios",
    //       devTeamId: "REPLACE_WITH_YOUR_TEAM_ID",
    //       mode: "development",
    //       moduleDependencies: ["Module.swift"],
    //       useLiveActivities: false,
    //       frequentUpdates: false,
    //     },
    //   },
    // ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#E4E4E7",
        image: "./assets/icon-light.png",
        dark: {
          backgroundColor: "#18181B",
          image: "./assets/icon-dark.png",
        },
      },
    ],
  ],
});
