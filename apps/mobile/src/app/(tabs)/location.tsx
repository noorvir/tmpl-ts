import React, { useState, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access location was denied");
      setLoading(false);
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);

    // Reverse geocode to get address
    const [geocoded] = await Location.reverseGeocodeAsync({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });

    if (geocoded) {
      const parts = [geocoded.city, geocoded.region, geocoded.country].filter(Boolean);
      setAddress(parts.join(", "));
    }

    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Location
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-100 p-4 dark:bg-red-900/30">
            <Text className="text-red-800 dark:text-red-200">{error}</Text>
          </View>
        )}

        {location && (
          <View className="mb-6 w-full rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <Text className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
              Coordinates
            </Text>
            <Text className="font-mono text-zinc-600 dark:text-zinc-400">
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text className="font-mono text-zinc-600 dark:text-zinc-400">
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>
            {address && (
              <>
                <Text className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Address
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-400">{address}</Text>
              </>
            )}
          </View>
        )}

        <Pressable
          onPress={getLocation}
          disabled={loading}
          className="rounded-xl bg-violet-600 px-8 py-4 active:bg-violet-700"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-lg font-semibold text-white">
              {location ? "Update Location" : "Get Location"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

