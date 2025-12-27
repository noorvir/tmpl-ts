import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function LocationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
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
        Boolean
      );
      setAddress(parts.join(", "));
    }

    setLoading(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Location</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {location && (
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f2f2f7" },
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>
              Coordinates
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>

            {address && (
              <>
                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Address
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {address}
                </Text>
              </>
            )}
          </View>
        )}

        <Pressable
          onPress={getLocation}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed || loading ? 0.7 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {location ? "Update Location" : "Get Location"}
            </Text>
          )}
        </Pressable>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.6,
  },
  value: {
    fontSize: 16,
    fontFamily: "SpaceMono",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});

