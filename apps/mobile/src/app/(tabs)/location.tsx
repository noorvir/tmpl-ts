import React, { useState, useEffect } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

export default function LocationScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup subscription on unmount
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed,
        timestamp: loc.timestamp,
      };

      setLocation(locationData);

      // Reverse geocoding
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addr) {
        const addressParts = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.country,
        ].filter(Boolean);
        setAddress(addressParts.join(", "));
      }
    } catch (error) {
      setErrorMsg("Failed to get location");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchLocation = async () => {
    if (isWatching && subscription) {
      subscription.remove();
      setSubscription(null);
      setIsWatching(false);
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setIsWatching(true);
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (loc) => {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy,
          speed: loc.coords.speed,
          timestamp: loc.timestamp,
        });
      }
    );
    setSubscription(sub);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
            Location Services
          </Text>
          <Text className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Access device GPS and location data
          </Text>
        </View>

        {/* Location Card */}
        <View className="rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-900">
          {errorMsg ? (
            <View className="items-center py-4">
              <Text className="text-4xl">⚠️</Text>
              <Text className="mt-2 text-center text-base text-red-500">
                {errorMsg}
              </Text>
            </View>
          ) : location ? (
            <View>
              {/* Coordinates */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  COORDINATES
                </Text>
                <Text className="mt-1 font-mono text-lg text-zinc-900 dark:text-white">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>

              {/* Address */}
              {address && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    ADDRESS
                  </Text>
                  <Text className="mt-1 text-base text-zinc-900 dark:text-white">
                    {address}
                  </Text>
                </View>
              )}

              {/* Details Grid */}
              <View className="flex-row flex-wrap">
                <DetailItem
                  label="Altitude"
                  value={
                    location.altitude
                      ? `${location.altitude.toFixed(1)}m`
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Accuracy"
                  value={
                    location.accuracy
                      ? `±${location.accuracy.toFixed(0)}m`
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Speed"
                  value={
                    location.speed
                      ? `${(location.speed * 3.6).toFixed(1)} km/h`
                      : "N/A"
                  }
                />
                <DetailItem
                  label="Updated"
                  value={new Date(location.timestamp).toLocaleTimeString()}
                />
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-5xl">📍</Text>
              <Text className="mt-3 text-center text-base text-zinc-600 dark:text-zinc-400">
                Tap the button below to get your current location
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View className="mt-6 space-y-3">
          <Pressable
            onPress={getCurrentLocation}
            disabled={isLoading}
            className={`flex-row items-center justify-center rounded-xl px-4 py-4 ${
              isLoading
                ? "bg-zinc-300 dark:bg-zinc-700"
                : "bg-violet-600 active:bg-violet-700"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Get Current Location
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={toggleWatchLocation}
            className={`flex-row items-center justify-center rounded-xl px-4 py-4 ${
              isWatching
                ? "bg-red-500 active:bg-red-600"
                : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {isWatching ? "Stop Tracking" : "Start Live Tracking"}
            </Text>
          </Pressable>
        </View>

        {/* Live Tracking Indicator */}
        {isWatching && (
          <View className="mt-4 flex-row items-center justify-center">
            <View className="mr-2 h-3 w-3 animate-pulse rounded-full bg-green-500" />
            <Text className="text-sm text-green-600 dark:text-green-400">
              Live tracking active
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 w-1/2 pr-2">
      <Text className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
        {label}
      </Text>
      <Text className="mt-0.5 text-base text-zinc-900 dark:text-white">
        {value}
      </Text>
    </View>
  );
}

