import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.dark[50],
          },
        }}
      />
    </SafeAreaProvider>
  );
}
