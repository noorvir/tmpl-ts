import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to MyApp
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          A fresh Expo app with tRPC integration
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    opacity: 0.7,
  },
});
