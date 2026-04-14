import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTaskStore } from "@/store/taskStore";
import { colors } from "@/theme/tokens";
import { formatDateTime } from "@/utils/taskUtils";

export default function TaskTrackingScreen(): React.ReactElement {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { currentTask, taskActivityLogs, isLoading, fetchTaskProgress } = useTaskStore((state) => ({
    currentTask: state.currentTask,
    taskActivityLogs: state.taskActivityLogs,
    isLoading: state.isLoading,
    fetchTaskProgress: state.fetchTaskProgress,
  }));

  useEffect(() => {
    if (!taskId) return;
    void fetchTaskProgress(taskId);
  }, [fetchTaskProgress, taskId]);

  if (!taskId) {
    return (
      <MarketplaceShell activeRoute="tracking">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Tracking unavailable</Text>
            <Button title="Back" onPress={() => router.back()} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="tracking">
      <Card>
        <Text style={styles.title}>Task Tracking</Text>
        <Text style={styles.body}>{currentTask?.title || `Task #${taskId}`}</Text>
      </Card>

      <Card>
        {isLoading ? <Text style={styles.body}>Loading tracking updates...</Text> : null}
        {!isLoading && taskActivityLogs.length === 0 ? (
          <Text style={styles.body}>No tracking/location activities available yet.</Text>
        ) : (
          <View style={styles.timeline}>
            {taskActivityLogs.map((item) => (
              <View key={String(item.id)} style={styles.timelineItem}>
                <Text style={styles.timelineMessage}>{item.message}</Text>
                <Text style={styles.timelineMeta}>{formatDateTime(item.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </MarketplaceShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  body: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  timeline: {
    gap: 8,
  },
  timelineItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 3,
  },
  timelineMessage: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  timelineMeta: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
  centerBox: {
    alignItems: "center",
    gap: 8,
  },
});

