import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius } from "@/theme/tokens";
import { useAuthStore } from "@/store/authStore";
import { isRequester } from "@/utils/taskUtils";

export function MarketplaceFooter(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.footer}>
      <View style={styles.topGrid}>
        <View style={styles.column}>
          <Text style={styles.brandTitle}>ConnectMyTask</Text>
          <Text style={styles.bodyText}>
            A platform connecting service providers with clients for various tasks.
          </Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>For Clients</Text>
          <FooterLink label="Browse Tasks" onPress={() => router.push("/browse-tasks")} />
          <FooterLink
            label="Post a Task"
            onPress={() => router.push(isRequester(user) ? "/post-task" : "/sign-in")}
          />
          <FooterLink label="How it Works" onPress={() => router.push("/browse-tasks")} />
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>For Providers</Text>
          <FooterLink label="Find Work" onPress={() => router.push("/browse-tasks")} />
          <FooterLink label="Become a Provider" onPress={() => router.push("/sign-up")} />
          <FooterLink label="Resources" onPress={() => router.push("/task-progress")} />
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Company</Text>
          <FooterLink label="About Us" onPress={() => router.push("/browse-tasks")} />
          <FooterLink label="Privacy Policy" onPress={() => router.push("/browse-tasks")} />
          <FooterLink label="Terms of Service" onPress={() => router.push("/browse-tasks")} />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.copyText}>© 2026 ConnectMyTask. All rights reserved.</Text>
        <View style={styles.socialRow}>
          <Text style={styles.socialText}>Facebook</Text>
          <Text style={styles.socialText}>Twitter</Text>
          <Text style={styles.socialText}>LinkedIn</Text>
        </View>
      </View>
    </View>
  );
}

function FooterLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.dark[900],
    padding: 18,
    gap: 18,
  },
  topGrid: {
    gap: 18,
  },
  column: {
    gap: 8,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  columnTitle: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  bodyText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: "#e2e8f0",
    fontSize: 13,
    lineHeight: 18,
  },
  bottomRow: {
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 16,
    gap: 10,
  },
  copyText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 16,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  socialText: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
