import React from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout(): React.ReactElement {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthScreen = pathname === "/sign-in" || pathname === "/sign-up";

  if (!hasHydrated || !pathname) {
    return <SafeAreaProvider />;
  }

  // Mobile app is auth-gated: users must sign in/register before accessing the app.
  if (!isAuthenticated && !isAuthScreen) {
    return <Redirect href="/sign-in" />;
  }

  if (isAuthenticated && isAuthScreen) {
    return <Redirect href="/browse-tasks" />;
  }

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
