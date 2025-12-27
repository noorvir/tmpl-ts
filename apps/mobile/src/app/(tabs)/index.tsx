import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
      <View className="p-6">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-white">
          Hello NativeWind!
        </Text>
        <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Tailwind CSS styling is working.
        </Text>
      </View>
    </SafeAreaView>
  );
}
