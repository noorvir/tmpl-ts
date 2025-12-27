import React, { useState, useRef } from "react";
import { Text, View, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Handle permission not determined
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <Text className="text-zinc-600 dark:text-zinc-400">
          Loading camera...
        </Text>
      </SafeAreaView>
    );
  }

  // Handle permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-2 text-5xl">📸</Text>
          <Text className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-white">
            Camera Permission Required
          </Text>
          <Text className="mb-6 text-center text-base text-zinc-600 dark:text-zinc-400">
            We need access to your camera to take photos.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="rounded-xl bg-violet-600 px-6 py-3 active:bg-violet-700"
          >
            <Text className="text-base font-semibold text-white">
              Grant Permission
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const result = await cameraRef.current.takePictureAsync();
        if (result) {
          setPhoto(result.uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Show captured photo
  if (photo) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1">
          <Image source={{ uri: photo }} className="flex-1" resizeMode="contain" />
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center space-x-4">
            <Pressable
              onPress={() => setPhoto(null)}
              className="rounded-xl bg-white/20 px-6 py-3"
            >
              <Text className="text-base font-semibold text-white">Retake</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Handle save/upload photo
                Alert.alert("Success", "Photo saved!");
                setPhoto(null);
              }}
              className="rounded-xl bg-violet-600 px-6 py-3"
            >
              <Text className="text-base font-semibold text-white">Use Photo</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <CameraView ref={cameraRef} className="flex-1" facing={facing}>
          {/* Camera Overlay */}
          <View className="absolute inset-0 flex-1">
            {/* Top controls */}
            <View className="flex-row justify-between p-4">
              <Pressable
                onPress={toggleCameraFacing}
                className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
              >
                <Text className="text-xl">🔄</Text>
              </Pressable>
            </View>

            {/* Bottom controls */}
            <View className="flex-1" />
            <View className="flex-row items-center justify-center space-x-6 pb-12">
              <Pressable
                onPress={pickImage}
                className="h-14 w-14 items-center justify-center rounded-full bg-white/20"
              >
                <Text className="text-2xl">🖼️</Text>
              </Pressable>
              <Pressable
                onPress={takePicture}
                className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 active:bg-white/40"
              >
                <View className="h-16 w-16 rounded-full bg-white" />
              </Pressable>
              <View className="h-14 w-14" />
            </View>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

