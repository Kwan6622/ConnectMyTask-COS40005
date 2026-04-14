import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors } from "@/theme/tokens";
import { formatCurrency, isRequester } from "@/utils/taskUtils";

export default function RequesterDashboardScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { requesterTasks, fetchRequesterTasks } = useTaskStore((state) => ({
    requesterTasks: state.requesterTasks,
    fetchRequesterTasks: state.fetchRequesterTasks,
  }));

  useEffect(() => {
    if (!isAuthenticated || !isRequester(user)) return;
    void fetchRequesterTasks();
  }, [fetchRequesterTasks, isAuthenticated, user]);

  const stats = useMemo(() => {
    const open = requesterTasks.filter((t) => ["OPEN", "BIDDING"].includes(String(t.status))).length;
    const assigned = requesterTasks.filter((t) => String(t.status) === "ASSIGNED").length;
    const inProgress = requesterTasks.filter((t) => ["IN_PROGRESS", "PENDING_CONFIRMATION"].includes(String(t.status))).length;
    const totalBudget = requesterTasks.reduce((sum, t) => sum + Number(t.budget || 0), 0);
    return { open, assigned, inProgress, totalBudget };
  }, [requesterTasks]);

  if (!isAuthenticated || !isRequester(user)) {
    return (
      <MarketplaceShell activeRoute="requesterDashboard">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Requester access required</Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="requesterDashboard">
      <Card>
        <Text style={styles.title}>Requester Dashboard</Text>
        <Text style={styles.body}>Manage posted tasks, bids, and payment readiness.</Text>
      </Card>

      <Card>
        <View style={styles.statRow}>
          <Stat label="Open/Bidding" value={String(stats.open)} />
          <Stat label="Assigned" value={String(stats.assigned)} />
          <Stat label="In Progress" value={String(stats.inProgress)} />
          <Stat label="Budget" value={formatCurrency(stats.totalBudget)} />
        </View>
      </Card>

      <Card>
        <View style={styles.actionRow}>
          <Button title="Post Task" onPress={() => router.push("/post-task")} style={styles.actionBtn} />
          <Button title="My Posted Tasks" variant="outline" onPress={() => router.push("/my-posted-tasks")} style={styles.actionBtn} />
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

