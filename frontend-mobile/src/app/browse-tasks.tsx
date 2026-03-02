import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { TaskCard } from "@/components/TaskCard";
import { SORT_OPTIONS } from "@/constants/tasks";
import { useTaskStore } from "@/store/taskStore";
import { useAuthStore } from "@/store/authStore";
import { colors, radius } from "@/theme/tokens";
import { Task, TaskSortBy } from "@/types";
import { formatCategoryLabel, formatTaskStatusLabel, isTaskActive, normalizeTaskStatus } from "@/utils/taskUtils";

type CategoryFilter = "ALL" | string;
type StatusFilter = "ALL" | string;

const LOCATION_OPTIONS = [
  "",
  "District 1",
  "District 2",
  "District 3",
  "District 4",
  "District 5",
  "District 6",
  "District 7",
  "District 8",
  "District 9",
  "District 10",
  "District 11",
  "District 12",
  "Binh Thanh",
  "Phu Nhuan",
  "Go Vap",
  "Tan Binh",
  "Tan Phu",
  "Thu Duc",
];

export default function BrowseTasksScreen(): React.ReactElement {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { tasks, isLoading, error, fetchTasks } = useTaskStore((state) => ({
    tasks: state.tasks,
    isLoading: state.isLoading,
    error: state.error,
    fetchTasks: state.fetchTasks,
  }));

  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [sortBy, setSortBy] = useState<TaskSortBy>("most_recent");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      counts.set(task.category, (counts.get(task.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, label: formatCategoryLabel(value), count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const statuses = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      const normalized = normalizeTaskStatus(task.status);
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const min = minBudget ? Number(minBudget) : undefined;
    const max = maxBudget ? Number(maxBudget) : undefined;
    const selectedLocation = locationFilter.trim().toLowerCase();

    const list = tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);

      const matchesLocation =
        !selectedLocation || task.location.toLowerCase().includes(selectedLocation);
      const matchesCategory = categoryFilter === "ALL" || task.category === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || normalizeTaskStatus(task.status) === statusFilter;
      const matchesMin = typeof min !== "number" || Number.isNaN(min) ? true : (task.aiSuggestedPrice ?? task.budget) >= min;
      const matchesMax = typeof max !== "number" || Number.isNaN(max) ? true : (task.aiSuggestedPrice ?? task.budget) <= max;

      return matchesSearch && matchesLocation && matchesCategory && matchesStatus && matchesMin && matchesMax;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      const budgetA = a.aiSuggestedPrice ?? a.budget;
      const budgetB = b.aiSuggestedPrice ?? b.budget;
      if (sortBy === "price_low_to_high") return budgetA - budgetB;
      if (sortBy === "price_high_to_low") return budgetB - budgetA;
      if (sortBy === "deadline") {
        const aValue = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const bValue = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return aValue - bValue;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted;
  }, [tasks, searchText, locationFilter, categoryFilter, statusFilter, minBudget, maxBudget, sortBy]);

  const activeCount = useMemo(() => {
    return filteredTasks.filter((task) => isTaskActive(task.status)).length;
  }, [filteredTasks]);

  const clearFilters = (): void => {
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setSearchText("");
    setLocationFilter("");
    setLocationOpen(false);
    setMinBudget("");
    setMaxBudget("");
  };

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void fetchTasks()} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.heroTop}>
            <Button title="Return" variant="ghost" size="sm" onPress={() => router.push("/")} />
            <Badge label="Find Your Perfect Task" variant="primary" />
          </View>

          <Text style={styles.heroTitle}>Browse Available Tasks</Text>
          <Text style={styles.heroSubtitle}>
            Explore available tasks and connect with trusted task posters in your area.
          </Text>

          <View style={styles.searchStack}>
            <Input
              placeholder="What are you looking for?"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.heroInputWrap}
            />

            <View style={styles.locationWrap}>
              <Pressable onPress={() => setLocationOpen((prev) => !prev)} style={styles.locationButton}>
                <Text style={[styles.locationText, !locationFilter ? styles.locationTextPlaceholder : null]}>
                  {locationFilter || "All locations"}
                </Text>
                <Text style={styles.locationArrow}>{locationOpen ? "▲" : "▼"}</Text>
              </Pressable>

              {locationOpen ? (
                <View style={styles.locationMenu}>
                  <ScrollView nestedScrollEnabled style={styles.locationMenuScroll}>
                    {LOCATION_OPTIONS.map((location) => {
                      const selected = location === locationFilter;
                      return (
                        <Pressable
                          key={location || "all"}
                          onPress={() => {
                            setLocationFilter(location);
                            setLocationOpen(false);
                          }}
                          style={[styles.locationOption, selected ? styles.locationOptionSelected : null]}
                        >
                          <Text style={[styles.locationOptionText, selected ? styles.locationOptionTextSelected : null]}>
                            {location || "All locations"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <Button title="Search Tasks" onPress={() => setLocationOpen(false)} />
          </View>

          <View style={styles.heroStats}>
            <Text style={styles.heroStatText}>{activeCount} active tasks</Text>
            <Text style={styles.heroStatText}>Verified posters</Text>
          </View>
        </View>

        <Card style={styles.topCard}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.resultTitle}>{filteredTasks.length} Tasks Found</Text>
              <Text style={styles.resultSubTitle}>Showing all available tasks</Text>
            </View>
            <Badge label={`Sort: ${SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Most Recent"}`} variant="neutral" />
          </View>
          <View style={styles.chipWrap}>
            {SORT_OPTIONS.map((option) => {
              const selected = sortBy === option.value;
              return (
                <Button
                  key={option.value}
                  title={option.label}
                  variant={selected ? "primary" : "outline"}
                  size="sm"
                  onPress={() => setSortBy(option.value)}
                  style={styles.smallChip}
                />
              );
            })}
          </View>
        </Card>

        <Card
          title="Filters"
          actions={<Button title="Clear" variant="ghost" size="sm" onPress={clearFilters} />}
          style={styles.topCard}
        >
          <View style={styles.filters}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Categories</Text>
              <View style={styles.chipWrap}>
                <Button
                  title="All"
                  size="sm"
                  variant={categoryFilter === "ALL" ? "primary" : "outline"}
                  onPress={() => setCategoryFilter("ALL")}
                  style={styles.filterChip}
                />
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    title={`${category.label} (${category.count})`}
                    size="sm"
                    variant={categoryFilter === category.value ? "primary" : "outline"}
                    onPress={() => setCategoryFilter(category.value)}
                    style={styles.filterChip}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.chipWrap}>
                <Button
                  title="All"
                  size="sm"
                  variant={statusFilter === "ALL" ? "primary" : "outline"}
                  onPress={() => setStatusFilter("ALL")}
                  style={styles.filterChip}
                />
                {statuses.map((status) => (
                  <Button
                    key={status.value}
                    title={`${formatTaskStatusLabel(status.value)} (${status.count})`}
                    size="sm"
                    variant={statusFilter === status.value ? "primary" : "outline"}
                    onPress={() => setStatusFilter(status.value)}
                    style={styles.filterChip}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Budget Range (VND)</Text>
              <View style={styles.priceRow}>
                <Input
                  placeholder="Min"
                  keyboardType="numeric"
                  value={minBudget}
                  onChangeText={setMinBudget}
                  style={styles.priceInput}
                />
                <Input
                  placeholder="Max"
                  keyboardType="numeric"
                  value={maxBudget}
                  onChangeText={setMaxBudget}
                  style={styles.priceInput}
                />
              </View>
            </View>
          </View>
        </Card>

        <Card title="Results" actions={<Badge label={`${filteredTasks.length} tasks`} variant="neutral" />}>
          {isLoading && tasks.length === 0 ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary[600]} />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="Retry" onPress={() => void fetchTasks()} />
            </View>
          ) : null}

          {!isLoading && !error && filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tasks match your filters</Text>
              <Text style={styles.emptySubtitle}>Try another location or clear filters to view more jobs.</Text>
            </View>
          ) : null}

          {!error &&
            filteredTasks.map((task: Task) => (
              <TaskCard
                key={String(task.id)}
                task={task}
                onView={() => {
                  Alert.alert("Task Details", `${task.title}\n${task.location}`);
                }}
                onBid={() => {
                  Alert.alert("Bid Task", `Start bidding on: ${task.title}`);
                }}
              />
            ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  hero: {
    borderRadius: radius.xl,
    padding: 18,
    gap: 10,
    backgroundColor: "#2b49d9",
    overflow: "visible",
  },
  heroGlowOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.35)",
    top: -100,
    right: -70,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.35)",
    bottom: -90,
    left: -60,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 46,
    color: colors.white,
    fontWeight: "900",
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 24,
    color: "#dbeafe",
  },
  searchStack: {
    gap: 10,
    marginTop: 4,
  },
  heroInputWrap: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: radius.lg,
  },
  locationWrap: {
    position: "relative",
    zIndex: 100,
  },
  locationButton: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationText: {
    color: colors.dark[800],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  locationTextPlaceholder: {
    color: colors.dark[500],
    fontWeight: "500",
  },
  locationArrow: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 12,
  },
  locationMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    maxHeight: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.white,
    zIndex: 200,
  },
  locationMenuScroll: {
    maxHeight: 220,
  },
  locationOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  locationOptionText: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  locationOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: "700",
  },
  heroStats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 2,
  },
  heroStatText: {
    color: "#dbeafe",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  topCard: {
    borderColor: "#dbe2f2",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  resultTitle: {
    color: colors.dark[900],
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  resultSubTitle: {
    color: colors.dark[500],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  filters: {
    gap: 14,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.dark[700],
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    marginBottom: 2,
  },
  smallChip: {
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
  },
  priceInput: {
    flex: 1,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderStyle: "dashed",
    borderRadius: radius.lg,
    padding: 16,
    gap: 4,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.dark[800],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: colors.dark[500],
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger[600],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
