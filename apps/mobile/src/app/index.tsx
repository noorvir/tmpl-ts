import React from "react";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function Index() {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const handleSignIn = async () => {
    // Add your sign in logic here
    console.log("Sign in clicked");
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Home" }} />
      <View className="h-full w-full p-4">
        <Text className="py-2 text-3xl font-bold text-primary">
          TypeScript Template
        </Text>
        
        {session?.data?.user ? (
          <View className="mt-8">
            <Text className="text-lg text-foreground">
              Hello, {session.data.user.name || session.data.user.email}!
            </Text>
            <Button title="Sign Out" onPress={handleSignOut} />
          </View>
        ) : (
          <View className="mt-8">
            <Text className="text-lg text-foreground">
              You are not signed in.
            </Text>
            <Button title="Sign In" onPress={handleSignIn} />
          </View>
        )}

        <View className="mt-8">
          <Text className="text-base text-muted-foreground">
            This is a clean TypeScript template with auth ready to go.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
