import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";

import "../styles.css";

// Main layout wrapping pages with providers
export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#09090B" : "#FFFFFF",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </QueryClientProvider>
  );
}
