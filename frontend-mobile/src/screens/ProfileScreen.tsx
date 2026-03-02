import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme/tokens";

function accountTypeLabel(accountType?: string): string {
  if (!accountType) return "Not set";
  return accountType === "service_provider" ? "Service Provider" : "Client";
}

function ProfileField({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen(): React.ReactElement {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Badge label="Account" variant="neutral" />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Clean, card-based account details like web.</Text>
        </View>

        {user ? (
          <Card
            title="User Details"
            actions={<Badge label={user.role} variant={user.role === "admin" ? "warning" : "primary"} />}
            footer={<Button title="Logout" variant="danger" onPress={logout} />}
          >
            <View style={styles.fields}>
              <ProfileField label="Name" value={user.name} />
              <ProfileField label="Email" value={user.email} />
              <ProfileField label="Phone Number" value={user.phoneNumber || "Not set"} />
              <ProfileField label="Account Type" value={accountTypeLabel(user.accountType)} />
              <ProfileField label="Role" value={user.role} />
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Not signed in</Text>
              <Text style={styles.emptySubtitle}>
                Authenticate to view profile information.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark[50],
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.dark[900],
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.dark[600],
  },
  fields: {
    gap: 12,
  },
  fieldRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[100],
    paddingBottom: 12,
    gap: 3,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.dark[500],
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.dark[900],
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.dark[800],
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.dark[500],
    textAlign: "center",
  },
});
