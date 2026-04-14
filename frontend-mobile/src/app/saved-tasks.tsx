import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TaskCard } from "@/components/TaskCard";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors } from "@/theme/tokens";

export default function SavedTasksPage(): React.ReactElement {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { savedTasks, fetchSavedTasks, unsaveTask } = useTaskStore((state) => ({
    savedTasks: state.savedTasks,
    fetchSavedTasks: state.fetchSavedTasks,
    unsaveTask: state.unsaveTask,
  }));

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchSavedTasks();
  }, [fetchSavedTasks, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <MarketplaceShell activeRoute="saved">
        <Card>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Sign in to view saved tasks</Text>
            <Text style={styles.promptBody}>
              Saved tasks are shared with the same backend as web, so they appear consistently across both platforms.
            </Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="saved">
      <View style={styles.headerCopy}>
        <Text style={styles.pageTitle}>Saved Tasks</Text>
        <Text style={styles.pageSubtitle}>Review the tasks you bookmarked and keep them synced with web.</Text>
      </View>

      {savedTasks.length === 0 ? (
        <Card>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No saved tasks yet</Text>
            <Text style={styles.emptyBody}>Save tasks from Browse Tasks to keep them here.</Text>
            <Button title="Browse Tasks" onPress={() => router.push("/browse-tasks")} />
          </View>
        </Card>
      ) : (
        savedTasks.map((item) => (
          <TaskCard
            key={String(item.id)}
            task={item.task}
            isSaved
            onToggleSave={() => void unsaveTask(item.task.id)}
            onView={() => router.push({ pathname: "/task-detail", params: { taskId: String(item.task.id) } })}
          />
        ))
      )}
    </MarketplaceShell>
  );
}

const styles = StyleSheet.create({
  headerCopy: {
    gap: 2,
  },
  pageTitle: {
    color: colors.dark[900],
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
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
