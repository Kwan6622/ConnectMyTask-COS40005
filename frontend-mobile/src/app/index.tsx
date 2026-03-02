import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { TASK_CATEGORIES } from "@/constants/tasks";
import { colors, radius } from "@/theme/tokens";
import { formatCategoryLabel, isTaskActive, normalizeTaskStatus } from "@/utils/taskUtils";

function accountTypeLabel(accountType?: string): string {
  if (!accountType) return "User";
  return accountType === "service_provider" ? "Service Provider" : "Client";
}

const CATEGORY_ICONS: Record<string, string> = {
  DELIVERY: "🚚",
  HOME_REPAIR: "🔧",
  CLEANING: "✨",
  IT_SUPPORT: "💻",
  PERSONAL_ASSISTANT: "👤",
  MOVING: "📦",
  TUTORING: "📚",
  OTHER: "⭐",
};

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    logout: state.logout,
  }));
  const { tasks, fetchTasks } = useTaskStore((state) => ({
    tasks: state.tasks,
    fetchTasks: state.fetchTasks,
  }));

  useEffect(() => {
    if (isAuthenticated) {
      void fetchTasks();
    }
  }, [isAuthenticated, fetchTasks]);

  const activeTasks = useMemo(() => tasks.filter((task) => isTaskActive(task.status)).length, [tasks]);
  const completedTasks = useMemo(
    () => tasks.filter((task) => normalizeTaskStatus(task.status) === "COMPLETED").length,
    [tasks]
  );
  const categoryCounts = useMemo(
    () =>
      tasks.reduce<Record<string, number>>((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {}),
    [tasks]
  );
  const heroCategories = useMemo(
    () =>
      TASK_CATEGORIES.slice(0, 4).map((category) => ({
        key: category,
        icon: CATEGORY_ICONS[category] || "⭐",
        label: formatCategoryLabel(category),
        count: categoryCounts[category] || 0,
      })),
    [categoryCounts]
  );

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.brandTitle}>ConnectMyTask</Text>
              <Text style={styles.brandSubTitle}>AI-Powered Matching</Text>
            </View>
            {isAuthenticated ? (
              <View style={styles.authTopRow}>
                <Badge label={accountTypeLabel(user?.accountType)} variant="primary" />
                <Button title="Sign Out" variant="ghost" size="sm" onPress={logout} />
              </View>
            ) : null}
          </View>

          <Badge label="AI-Powered Task Matching" variant="primary" />
          <Text style={styles.heroTitle}>
            Find Trusted Help for
            <Text style={styles.heroTitleAccent}> Any Task</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect with skilled professionals for delivery, repairs, cleaning, IT support, and more.
          </Text>

          {isAuthenticated ? (
            <View style={styles.heroActions}>
              <Button title="Browse Tasks" size="lg" onPress={() => router.push("/browse-tasks")} style={styles.heroActionBtn} />
              <Button title="Post Task" variant="outline" onPress={() => router.push("/post-task")} style={styles.heroActionBtn} />
            </View>
          ) : (
            <View style={styles.heroActions}>
              <Button title="Sign In" size="lg" onPress={() => router.push("/sign-in")} style={styles.heroActionBtn} />
              <Button title="Sign Up" variant="outline" onPress={() => router.push("/sign-up")} style={styles.heroActionBtn} />
            </View>
          )}
        </View>

        <Card style={styles.illustrationCard}>
          <View style={styles.catGrid}>
            {heroCategories.map((category) => (
              <Pressable key={category.key} style={styles.catItem} onPress={() => router.push("/browse-tasks")}>
                <Text style={styles.catIcon}>{category.icon}</Text>
                <Text style={styles.catLabel}>{category.label}</Text>
                <Text style={styles.catCount}>{category.count} tasks</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{tasks.length || 0}</Text>
            <Text style={styles.statLabel}>Total tasks</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{activeTasks}</Text>
            <Text style={styles.statLabel}>Active tasks</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </Card>
        </View>

        <Card>
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Quick Summary</Text>
            <Text style={styles.summaryText}>Use Browse to filter by category, location, status, and budget.</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf2ff",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  heroSection: {
    borderRadius: radius.xl,
    backgroundColor: "#10214e",
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  heroGlowOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.28)",
    top: -100,
    right: -60,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.24)",
    bottom: -95,
    left: -50,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  brandSubTitle: {
    color: "#bfdbfe",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  authTopRow: {
    alignItems: "flex-end",
    gap: 8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900",
  },
  heroTitleAccent: {
    color: "#60a5fa",
  },
  heroSubtitle: {
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  heroActions: {
    gap: 10,
    marginTop: 2,
  },
  heroActionBtn: {
    width: "100%",
  },
  illustrationCard: {
    borderColor: "#d6e0ff",
    backgroundColor: "#f8fbff",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catItem: {
    width: "47%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 2,
  },
  catIcon: {
    fontSize: 24,
    lineHeight: 28,
  },
  catLabel: {
    color: colors.dark[800],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  catCount: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderColor: "#dbe2f2",
  },
  statNumber: {
    color: colors.primary[700],
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.dark[600],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  summarySection: {
    gap: 6,
  },
  summaryTitle: {
    color: colors.dark[900],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  summaryText: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
