import React from "react";
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { AIAssistantButton } from "@/components/AIAssistantButton";
import { MarketplaceHeader, MarketplaceRouteKey } from "@/components/MarketplaceHeader";

interface MarketplaceShellProps extends Pick<ScrollViewProps, "refreshControl"> {
  activeRoute: MarketplaceRouteKey;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function MarketplaceShell({
  activeRoute,
  children,
  contentContainerStyle,
  refreshControl,
}: MarketplaceShellProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 768 ? 24 : width < 390 ? 12 : 16;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingHorizontal: horizontalPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          <MarketplaceHeader activeRoute={activeRoute} />
          {children}
          <MarketplaceFooter />
        </ScrollView>
        <AIAssistantButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },
  container: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 112,
    gap: 14,
  },
});
