import React from "react";
import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";

import { authClient } from "~/utils/auth";
import { trpc, queryClient } from "~/utils/api";

export default function HomeScreen() {
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  // Example of using tRPC - fetching health check
  const healthQ = useQuery(trpc.health.check.queryOptions());

  const handleSignIn = async () => {
    // Redirect to your auth flow
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "myapp://",
    });
    refetchSession();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    queryClient.invalidateQueries({ queryKey: ["session"] });
    refetchSession();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-white">
            Welcome to MyApp
            
          </Text>
          <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Your TypeScript mobile template with tRPC
          </Text>
        </View>

        {/* tRPC Status */}
        <View className="mb-6 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Backend Status
          </Text>
          <View className="mt-2 flex-row items-center">
            <View
              className={`h-3 w-3 rounded-full ${
                healthQ.data ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <Text className="ml-2 text-base text-zinc-900 dark:text-white">
              {healthQ.isLoading
                ? "Connecting..."
                : healthQ.data
                  ? "Connected"
                  : "Disconnected"}
            </Text>
          </View>
        </View>

        {/* Auth Section */}
        <View className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          {session?.data?.user ? (
            <View>
              <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Signed in as
              </Text>
              <Text className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {session.data.user.name || session.data.user.email}
              </Text>
              <Pressable
                onPress={handleSignOut}
                className="mt-4 rounded-xl bg-red-500 px-4 py-3 active:bg-red-600"
              >
                <Text className="text-center text-base font-semibold text-white">
                  Sign Out
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="text-base text-zinc-600 dark:text-zinc-400">
                Sign in to sync your data across devices.
              </Text>
              <Pressable
                onPress={handleSignIn}
                className="mt-4 rounded-xl bg-violet-600 px-4 py-3 active:bg-violet-700"
              >
                <Text className="text-center text-base font-semibold text-white">
                  Sign In with Google
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Features Overview */}
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
            Features
          </Text>
          <View className="space-y-2">
            <FeatureItem icon="📸" title="Camera" description="Take photos and scan documents" />
            <FeatureItem icon="📍" title="Location" description="Access GPS and maps" />
            <FeatureItem icon="🏠" title="Widgets" description="Home screen widgets" />
            <FeatureItem icon="🔐" title="Auth" description="Secure authentication" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
      <Text className="text-2xl">{icon}</Text>
      <View className="ml-3">
        <Text className="font-medium text-zinc-900 dark:text-white">{title}</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">{description}</Text>
      </View>
    </View>
  );
}

