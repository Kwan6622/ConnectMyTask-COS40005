import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors } from "@/theme/tokens";
import { isProvider } from "@/utils/taskUtils";

export default function ProviderDashboardScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { assignedTasks, fetchAssignedTasks } = useTaskStore((state) => ({
    assignedTasks: state.assignedTasks,
    fetchAssignedTasks: state.fetchAssignedTasks,
  }));

  useEffect(() => {
    if (!isAuthenticated || !isProvider(user)) return;
    void fetchAssignedTasks();
  }, [fetchAssignedTasks, isAuthenticated, user]);

  const stats = useMemo(() => {
    const assigned = assignedTasks.filter((t) => String(t.status) === "ASSIGNED").length;
    const inProgress = assignedTasks.filter((t) => ["IN_PROGRESS", "PENDING_CONFIRMATION"].includes(String(t.status))).length;
    const awaitingPayment = assignedTasks.filter((t) => String(t.status) === "AWAITING_PAYMENT").length;
    return { assigned, inProgress, awaitingPayment, total: assignedTasks.length };
  }, [assignedTasks]);

  if (!isAuthenticated || !isProvider(user)) {
    return (
      <MarketplaceShell activeRoute="providerDashboard">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Provider access required</Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="providerDashboard">
      <Card>
        <Text style={styles.title}>Provider Dashboard</Text>
        <Text style={styles.body}>Track assignments, work progress, and bid performance.</Text>
      </Card>

      <Card>
        <View style={styles.statRow}>
          <Stat label="Total Assigned" value={String(stats.total)} />
          <Stat label="Assigned" value={String(stats.assigned)} />
          <Stat label="In Progress" value={String(stats.inProgress)} />
          <Stat label="Awaiting Payment" value={String(stats.awaitingPayment)} />
        </View>
      </Card>

      <Card>
        <View style={styles.actionRow}>
          <Button title="Browse Tasks" onPress={() => router.push("/browse-tasks")} style={styles.actionBtn} />
          <Button title="Suggested Tasks" variant="outline" onPress={() => router.push("/suggested-tasks")} style={styles.actionBtn} />
          <Button title="My Bids" variant="outline" onPress={() => router.push("/my-bids")} style={styles.actionBtn} />
          <Button title="Task Progress" variant="outline" onPress={() => router.push("/task-progress")} style={styles.actionBtn} />
        </View>
      </Card>
    </MarketplaceShell>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.dark[900],
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  body: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  statRow: {
    gap: 10,
  },
  statCard: {
    borderRadius: 12,
    backgroundColor: colors.dark[50],
    padding: 12,
  },
  statValue: {
    color: colors.dark[900],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    gap: 10,
  },
  actionBtn: {
    width: "100%",
  },
  centerBox: {
    alignItems: "center",
    gap: 8,
  },
});
