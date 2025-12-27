import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "@/lib/tw";

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
          A fresh Expo app with tRPC integration
        </Text>
        <View style={tw`mt-8 p-4 rounded-2xl bg-primary/10`}>
          <Text style={tw`text-primary text-center`}>Styled with twrnc</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
