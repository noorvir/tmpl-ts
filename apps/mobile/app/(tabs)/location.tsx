import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import tw from "@/lib/tw";

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
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
      const parts = [geocoded.city, geocoded.region, geocoded.country].filter(
        Boolean,
      );
      setAddress(parts.join(", "));
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
      <View style={tw`flex-1 items-center justify-center p-6`}>
        <Text style={tw`text-2xl font-bold mb-6 text-black dark:text-white`}>
          Location
        </Text>

        {error && (
          <View
            style={tw`bg-red-100 dark:bg-red-900/30 p-4 rounded-xl mb-4 w-full`}
          >
            <Text style={tw`text-red-700 dark:text-red-400 text-center`}>
              {error}
            </Text>
          </View>
        )}

        {location && (
          <View
            style={tw`bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl w-full mb-6`}
          >
            <Text
              style={tw`text-sm font-semibold opacity-60 mb-1 text-black dark:text-white`}
            >
              Coordinates
            </Text>
            <Text style={tw`text-base font-mono text-black dark:text-white`}>
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={tw`text-base font-mono text-black dark:text-white`}>
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>

            {address && (
              <>
                <Text
                  style={tw`text-sm font-semibold opacity-60 mb-1 mt-4 text-black dark:text-white`}
                >
                  Address
                </Text>
                <Text style={tw`text-base text-black dark:text-white`}>
                  {address}
                </Text>
              </>
            )}
          </View>
        )}

        <Pressable
          onPress={getLocation}
          disabled={loading}
          style={({ pressed }) =>
            tw.style(
              `bg-blue-500 py-4 px-8 rounded-xl min-w-[200px] items-center`,
              (pressed || loading) && `opacity-70`,
            )
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={tw`text-white text-lg font-semibold`}>
              {location ? "Update Location" : "Get Location"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
