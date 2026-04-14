import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors, radius } from "@/theme/tokens";
import { formatCurrency, formatDate, formatTaskStatusLabel, getBidCount, isRequester } from "@/utils/taskUtils";

export default function MyPostedTasksPage(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { requesterTasks, fetchRequesterTasks, isLoading } = useTaskStore((state) => ({
    requesterTasks: state.requesterTasks,
    fetchRequesterTasks: state.fetchRequesterTasks,
    isLoading: state.isLoading,
  }));
  const [ratingTaskId, setRatingTaskId] = useState<string | number | null>(null);
  const [ratingScore, setRatingScore] = useState("5");
  const [ratingComment, setRatingComment] = useState("");
  const [ratingTargetUserId, setRatingTargetUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isRequester(user)) return;
    void fetchRequesterTasks();
  }, [fetchRequesterTasks, isAuthenticated, user]);

  const metrics = useMemo(() => {
    const assigned = requesterTasks.filter((task) => task.assignedProviderId != null).length;
    const inProgress = requesterTasks.filter((task) =>
      ["IN_PROGRESS", "PENDING_CONFIRMATION"].includes(String(task.status))
    ).length;
    const totalBudget = requesterTasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);

    return {
      posted: requesterTasks.length,
      assigned,
      inProgress,
      totalBudget,
    };
  }, [requesterTasks]);

  if (!isAuthenticated || !isRequester(user)) {
    return (
      <MarketplaceShell activeRoute="posted">
        <Card>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Requester workspace required</Text>
            <Text style={styles.promptBody}>
              My Posted Tasks follows the requester workflow from web. Sign in with a requester/client account to continue.
            </Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  const openRating = async (taskId: string | number): Promise<void> => {
    try {
      const response = await api.ratings.getMyTaskRatingStatus(taskId);
      const data = response.data || {};
      if (!data.canRate || data.hasRated) {
        Alert.alert("Not available", data.reason || "You can rate provider only once after completion.");
        return;
      }
      setRatingTaskId(taskId);
      setRatingTargetUserId(data.toUserId ? Number(data.toUserId) : null);
    } catch (error: any) {
      Alert.alert("Cannot rate", error?.response?.data?.message || "Rating is not available for this task.");
    }
  };

  const submitRating = async (): Promise<void> => {
    if (!ratingTaskId || !ratingTargetUserId) return;
    const score = Number(ratingScore);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      Alert.alert("Invalid rating", "Rating must be an integer from 1 to 5.");
      return;
    }
    try {
      await api.ratings.create({
        taskId: Number(ratingTaskId),
        toUserId: ratingTargetUserId,
        rating: score,
        comment: ratingComment.trim() || undefined,
      });
      Alert.alert("Thank you", "Provider review submitted successfully.");
      setRatingTaskId(null);
      setRatingTargetUserId(null);
      setRatingComment("");
      setRatingScore("5");
    } catch (error: any) {
      Alert.alert("Review failed", error?.response?.data?.message || "Cannot submit review right now.");
    }
  };

  return (
    <MarketplaceShell activeRoute="posted">
      <View style={styles.dashboardCard}>
        <View style={styles.dashboardHeader}>
          <View style={styles.dashboardCopy}>
            <Text style={styles.workspaceTag}>REQUESTER WORKSPACE</Text>
            <Text style={styles.dashboardTitle}>Task Progress Dashboard</Text>
            <Text style={styles.dashboardBody}>
              Track assigned work, review bids, and monitor provider progress updates transparently.
            </Text>
          </View>
          <View style={styles.dashboardActions}>
            <Button title={isLoading ? "Refreshing..." : "Refresh"} size="sm" variant="outline" onPress={() => void fetchRequesterTasks()} />
            <Button title="Post Task" size="sm" onPress={() => router.push("/post-task")} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="My Posted Tasks" value={String(metrics.posted)} />
          <MetricCard label="Assigned Tasks" value={String(metrics.assigned)} />
          <MetricCard label="Task Progress" value={String(metrics.inProgress)} />
          <MetricCard label="Budget Pipeline" value={formatCurrency(metrics.totalBudget)} />
        </View>
      </View>

      {requesterTasks.length === 0 ? (
        <Card>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No posted tasks yet</Text>
            <Text style={styles.emptyBody}>Start by creating your first task in the shared requester workflow.</Text>
            <Button title="Create Task" onPress={() => router.push("/post-task")} />
          </View>
        </Card>
      ) : (
        requesterTasks.map((task) => (
          <Card key={String(task.id)}>
            <View style={styles.taskRow}>
              <View style={styles.taskCopy}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription} numberOfLines={3}>
                  {task.description}
                </Text>
                <View style={styles.taskMetaGrid}>
                  <Text style={styles.taskMeta}>Bids: {getBidCount(task)}</Text>
                  <Text style={styles.taskMeta}>Budget: {formatCurrency(Number(task.budget || 0))}</Text>
                  <Text style={styles.taskMeta}>Assigned: {formatTaskStatusLabel(task.status)}</Text>
                  <Text style={styles.taskMeta}>Created: {formatDate(task.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.taskActionColumn}>
                <Button
                  title="View Task"
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    router.push({ pathname: "/task-detail", params: { taskId: String(task.id) } })
                  }
                />
                <Button
                  title="Track Progress"
                  size="sm"
                  onPress={() =>
                    router.push({ pathname: "/task-progress", params: { taskId: String(task.id) } })
                  }
                />
                {["COMPLETED", "AWAITING_PAYMENT", "PAID"].includes(String(task.status || "")) &&
                task.assignedProviderId ? (
                  <Button title="Rate Provider" size="sm" variant="outline" onPress={() => void openRating(task.id)} />
                ) : null}
              </View>
            </View>
          </Card>
        ))
      )}

      {ratingTaskId ? (
        <Card title="Leave a review">
          <View style={styles.ratingForm}>
            <Input
              label="Stars (1-5)"
              keyboardType="numeric"
              value={ratingScore}
              onChangeText={setRatingScore}
            />
            <Input
              label="Comment (optional)"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
            />
            <View style={styles.ratingActions}>
              <Button title="Cancel" variant="outline" onPress={() => setRatingTaskId(null)} style={styles.actionFill} />
              <Button title="Submit Review" onPress={() => void submitRating()} style={styles.actionFill} />
            </View>
          </View>
        </Card>
      ) : null}
    </MarketplaceShell>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.dark[100],
    padding: 18,
    gap: 16,
  },
  dashboardHeader: {
    gap: 14,
  },
  dashboardCopy: {
    gap: 4,
  },
  workspaceTag: {
    color: colors.primary[700],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dashboardTitle: {
    color: colors.dark[900],
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  dashboardBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  dashboardActions: {
    flexDirection: "row",
    gap: 8,
  },
  metricRow: {
    gap: 10,
  },
  metricCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  taskRow: {
    gap: 12,
  },
  taskCopy: {
    gap: 8,
  },
  taskTitle: {
    color: colors.dark[900],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  taskDescription: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  taskMetaGrid: {
    gap: 4,
  },
  taskMeta: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  taskActionColumn: {
    gap: 8,
  },
  ratingForm: {
    gap: 10,
  },
  ratingActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionFill: {
    flex: 1,
  },
  emptyBox: {
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.dark[900],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  promptBox: {
    alignItems: "center",
    gap: 8,
  },
  promptTitle: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  promptBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
