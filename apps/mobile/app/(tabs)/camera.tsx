import { useState, useRef } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import tw from "@/lib/tw";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const cameraRef = useRef<CameraView>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    const result = await cameraRef.current.takePictureAsync();
    if (result) {
      setPhoto(result.uri);
    }
  };

  const handleToggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
        <View style={tw`flex-1 items-center justify-center p-6`}>
          <Text
            style={tw`text-2xl font-bold mb-4 text-black dark:text-white text-center`}
          >
            Camera Access Required
          </Text>
          <Text
            style={tw`text-base text-gray-600 dark:text-gray-400 text-center mb-8`}
          >
            We need your permission to use the camera
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) =>
              tw.style(
                `bg-blue-500 py-4 px-8 rounded-xl`,
                pressed && `opacity-70`,
              )
            }
          >
            <Text style={tw`text-white text-lg font-semibold`}>
              Grant Permission
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (photo) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black`}>
        <View style={tw`flex-1`}>
          <Image source={{ uri: photo }} style={tw`flex-1`} />
          <View
            style={tw`absolute bottom-10 left-0 right-0 flex-row justify-center gap-4`}
          >
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) =>
                tw.style(
                  `bg-white/20 py-4 px-8 rounded-xl`,
                  pressed && `opacity-70`,
                )
              }
            >
              <Text style={tw`text-white text-lg font-semibold`}>Retake</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <View style={tw`flex-1`}>
        <CameraView ref={cameraRef} style={tw`flex-1`} facing={facing}>
          <View
            style={tw`absolute bottom-10 left-0 right-0 flex-row justify-center items-center gap-8`}
          >
            <Pressable
              onPress={handleToggleFacing}
              style={({ pressed }) =>
                tw.style(
                  `bg-white/20 p-4 rounded-full`,
                  pressed && `opacity-70`,
                )
              }
            >
              <Text style={tw`text-white text-base`}>Flip</Text>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) =>
                tw.style(
                  `bg-white w-20 h-20 rounded-full items-center justify-center`,
                  pressed && `opacity-70`,
                )
              }
            >
              <View style={tw`bg-white w-16 h-16 rounded-full border-4 border-black`} />
            </Pressable>
            <View style={tw`w-14`} />
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

