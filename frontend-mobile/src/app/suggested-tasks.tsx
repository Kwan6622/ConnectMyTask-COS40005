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
import { isTaskBrowsable } from "@/utils/taskUtils";

export default function SuggestedTasksScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { suggestedTasks, savedTaskIds, fetchSuggestedTasks, saveTask, unsaveTask, isLoading } = useTaskStore((state) => ({
    suggestedTasks: state.suggestedTasks,
    savedTaskIds: state.savedTaskIds,
    fetchSuggestedTasks: state.fetchSuggestedTasks,
    saveTask: state.saveTask,
    unsaveTask: state.unsaveTask,
    isLoading: state.isLoading,
  }));

  useEffect(() => {
    if (!isAuthenticated || String(user?.role || "").toUpperCase() !== "PROVIDER") return;
    void fetchSuggestedTasks();
  }, [fetchSuggestedTasks, isAuthenticated, user?.role]);

  const actionableSuggestedTasks = suggestedTasks.filter((task) => isTaskBrowsable(task));

  if (!isAuthenticated || String(user?.role || "").toUpperCase() !== "PROVIDER") {
    return (
      <MarketplaceShell activeRoute="suggested">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Provider access required</Text>
            <Text style={styles.body}>Suggested Tasks are available only for provider accounts.</Text>
            <Button title="Browse Tasks" onPress={() => router.push("/browse-tasks")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="suggested">
      <Card>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Suggested Tasks</Text>
            <Text style={styles.body}>Ranked by specialty, district proximity, and open bidding opportunities.</Text>
          </View>
          <Button title={isLoading ? "Refreshing..." : "Refresh"} size="sm" variant="outline" onPress={() => void fetchSuggestedTasks()} />
        </View>
      </Card>

      {actionableSuggestedTasks.length === 0 ? (
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>No suggestions yet</Text>
            <Text style={styles.body}>Complete your provider profile specialties and district to improve suggestions.</Text>
          </View>
        </Card>
      ) : (
        actionableSuggestedTasks.map((task) => {
          const isSaved = savedTaskIds.some((id) => String(id) === String(task.id));
          return (
            <TaskCard
              key={String(task.id)}
              task={task}
              isSaved={isSaved}
              onToggleSave={() => {
                if (isSaved) {
                  void unsaveTask(task.id);
                } else {
                  void saveTask(task.id);
                }
              }}
              onView={() => router.push({ pathname: "/task-detail", params: { taskId: String(task.id) } })}
              onBid={() => router.push({ pathname: "/task-detail", params: { taskId: String(task.id) } })}
            />
          );
        })
      )}
    </MarketplaceShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
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
  centerBox: {
    alignItems: "center",
    gap: 8,
  },
});
