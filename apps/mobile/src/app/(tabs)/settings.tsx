import React from "react";
import { Text, View, Pressable, Switch, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import * as Application from "expo-constants";

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const handleWidgetInfo = () => {
    Alert.alert(
      "Home Screen Widgets",
      "To add a widget:\n\n" +
        "iOS: Long press on your home screen, tap '+', search for 'MyApp'\n\n" +
        "Android: Long press on your home screen, select 'Widgets', find 'MyApp Widget'",
      [{ text: "Got it" }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
            Settings
          </Text>
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            Appearance
          </Text>
          <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <View className="flex-row items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <View className="flex-row items-center">
                <Text className="mr-3 text-xl">🌙</Text>
                <Text className="text-base text-zinc-900 dark:text-white">
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={colorScheme === "dark"}
                onValueChange={toggleColorScheme}
                trackColor={{ false: "#e5e7eb", true: "#7c3aed" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            Features
          </Text>
          <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <SettingsRow
              icon="🏠"
              title="Home Screen Widgets"
              subtitle="Add widgets to your home screen"
              onPress={handleWidgetInfo}
            />
            <SettingsRow
              icon="⚙️"
              title="App Permissions"
              subtitle="Camera, location, and more"
              onPress={openAppSettings}
              showBorder={false}
            />
          </View>
        </View>

        {/* Development Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            Development
          </Text>
          <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <View className="p-4">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Backend URL
              </Text>
              <Text className="mt-1 font-mono text-sm text-zinc-900 dark:text-white">
                {process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}
              </Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View className="mt-auto items-center pb-6">
          <Text className="text-sm text-zinc-400 dark:text-zinc-600">
            MyApp v{Application.default.expoConfig?.version || "0.1.0"}
          </Text>
          <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
            Built with Expo + tRPC
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  showBorder = true,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  showBorder?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 active:bg-zinc-200 dark:active:bg-zinc-800 ${
        showBorder ? "border-b border-zinc-200 dark:border-zinc-800" : ""
      }`}
    >
      <Text className="mr-3 text-xl">{icon}</Text>
      <View className="flex-1">
        <Text className="text-base text-zinc-900 dark:text-white">{title}</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </Text>
      </View>
      <Text className="text-zinc-400">›</Text>
    </Pressable>
  );
}

