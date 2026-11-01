import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @module api
import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/utils/api";
// @end-module
import tw from "@/lib/tw";

// @module api
function ApiStatus() {
  const healthQ = useQuery({
    queryKey: ["health"],
    queryFn: () => api.health.check(),
  });

  let label = "Checking API…";
  if (healthQ.isError) {
    label = "API offline";
  }
  if (healthQ.isSuccess) {
    label = "API online";
  }

  return (
    <Text
      accessibilityLiveRegion="polite"
      style={tw`mt-4 text-center text-gray-600 dark:text-gray-400`}
    >
      {label}
    </Text>
  );
}

// @end-module
export default function HomeScreen() {
  return (
    <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
      <View style={tw`flex-1 items-center justify-center p-6`}>
        <Text
          style={tw`text-3xl font-bold text-center text-black dark:text-white`}
        >
          Welcome to MyApp now
        </Text>
        <Text
          style={tw`text-base mt-3 text-center text-gray-600 dark:text-gray-400`}
        >
          A fresh Expo app
        </Text>
        <View style={tw`mt-8 p-4 rounded-2xl bg-primary/10`}>
          <Text style={tw`text-primary text-center`}>Styled with twrnc</Text>
        </View>
        {/* @module api */}
        <ApiStatus />
        {/* @end-module */}
      </View>
    </SafeAreaView>
  );
}
