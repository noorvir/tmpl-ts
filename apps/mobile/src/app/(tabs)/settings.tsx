import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-white">
          Settings
        </Text>
        <Text className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          Configure your app here
        </Text>
      </View>
    </SafeAreaView>
  );
}
