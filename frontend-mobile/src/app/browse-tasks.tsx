import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TaskCard } from "@/components/TaskCard";
import { BROWSE_STATUS_OPTIONS, TASK_CATEGORIES } from "@/constants/tasks";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors, radius } from "@/theme/tokens";
import { TaskStatus } from "@/types";
import {
  formatCategoryLabel,
  getTaskDisplayBudget,
  getVisiblePages,
  isTaskActive,
  isTaskBrowsable,
} from "@/utils/taskUtils";

export default function BrowseTasksScreen(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 2 : 1;
  const itemsPerPage = columns * 4;
  const params = useLocalSearchParams<{ q?: string; mode?: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    tasks,
    suggestedTasks,
    savedTaskIds,
    isLoading,
    fetchTasks,
    fetchSuggestedTasks,
    saveTask,
    unsaveTask,
  } = useTaskStore((state) => ({
    tasks: state.tasks,
    suggestedTasks: state.suggestedTasks,
    savedTaskIds: state.savedTaskIds,
    isLoading: state.isLoading,
    fetchTasks: state.fetchTasks,
    fetchSuggestedTasks: state.fetchSuggestedTasks,
    saveTask: state.saveTask,
    unsaveTask: state.unsaveTask,
  }));
  const isProviderUser = String(user?.role || "").toUpperCase() === "PROVIDER";
  const browseMode = isProviderUser && params.mode === "suggested" ? "suggested" : "all";

  const [draftSearch, setDraftSearch] = useState(typeof params.q === "string" ? params.q : "");
  const [draftStatus, setDraftStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [draftBudget, setDraftBudget] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState(typeof params.q === "string" ? params.q : "");
  const [appliedStatus, setAppliedStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [appliedBudget, setAppliedBudget] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (browseMode === "suggested") {
      void fetchSuggestedTasks();
      return;
    }
    void fetchTasks();
  }, [browseMode, fetchSuggestedTasks, fetchTasks]);

  useEffect(() => {
    if (typeof params.q === "string") {
      setDraftSearch(params.q);
      setAppliedSearch(params.q);
      setCurrentPage(1);
    }
  }, [params.q]);

  const sourceTasks = browseMode === "suggested" ? suggestedTasks : tasks;
  const browseVisibleTasks = useMemo(() => sourceTasks.filter((task) => isTaskBrowsable(task)), [sourceTasks]);

  const categories = useMemo(
    () =>
      TASK_CATEGORIES.map((category) => ({
        value: category,
        label: formatCategoryLabel(category),
        count: browseVisibleTasks.filter((task) => String(task.category) === category && isTaskActive(task.status)).length,
      })),
    [browseVisibleTasks]
  );

  const filteredTasks = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    const ceiling = appliedBudget ? Number(appliedBudget) : undefined;

    return browseVisibleTasks.filter((task) => {
      const budget = getTaskDisplayBudget(task);
      const normalizedTitle = String(task.title || "").toLowerCase();
      const normalizedDescription = String(task.description || "").toLowerCase();
      const matchesSearch = !query || normalizedTitle.includes(query) || normalizedDescription.includes(query);
      const matchesStatus = appliedStatus === "ALL" || task.status === appliedStatus;
      const matchesCategory = categoryFilter === "ALL" || task.category === categoryFilter;
      const matchesBudget =
        !ceiling || Number.isNaN(ceiling) || ceiling <= 0 ? true : budget <= ceiling;

      return matchesSearch && matchesStatus && matchesCategory && matchesBudget;
    });
  }, [appliedBudget, appliedSearch, appliedStatus, browseVisibleTasks, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedTasks = filteredTasks.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const visiblePages = getVisiblePages(safePage, pageCount);
  const activeTasks = useMemo(() => browseVisibleTasks.filter((task) => isTaskActive(task.status)).length, [browseVisibleTasks]);

  const applyFilters = (): void => {
    setAppliedSearch(draftSearch);
    setAppliedStatus(draftStatus);
    setAppliedBudget(draftBudget);
    setCurrentPage(1);
    setStatusMenuOpen(false);
  };

  const resetFilters = (): void => {
    setDraftSearch("");
    setDraftStatus("ALL");
    setDraftBudget("");
    setAppliedSearch("");
    setAppliedStatus("ALL");
    setAppliedBudget("");
    setCategoryFilter("ALL");
    setCurrentPage(1);
    setStatusMenuOpen(false);
  };

  const adjustBudget = (delta: number): void => {
    const currentValue = Number(draftBudget || 0);
    const nextValue = Math.max(0, currentValue + delta);
    setDraftBudget(nextValue === 0 ? "" : String(Math.round(nextValue)));
  };

  return (
    <MarketplaceShell
      activeRoute={browseMode === "suggested" ? "suggested" : "browse"}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => (browseMode === "suggested" ? void fetchSuggestedTasks() : void fetchTasks())}
        />
      }
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Trusted marketplace for daily tasks</Text>
        <Text style={styles.heroTitle}>Find skilled helpers fast, with clear budgets and verified task flow</Text>
        <Text style={styles.heroBody}>
          Browse available tasks, filter by status and budget, and connect with trusted providers in Ho Chi Minh City.
        </Text>

        <View style={styles.heroStatsRow}>
          <HeroStat value={`${activeTasks} live`} label="Real-time updates" />
          <HeroStat value={`${browseVisibleTasks.length}`} label={browseMode === "suggested" ? "Suggested tasks" : "Total listed tasks"} />
          <HeroStat value={`${filteredTasks.length}`} label="Matching your filters" />
          <HeroStat
            value={columns === 1 ? "Mobile-first layout" : "Large-screen layout"}
            label={`Showing ${columns} column${columns > 1 ? "s" : ""}`}
            subLabel="Readable spacing, cleaner hierarchy, and consistent card rhythm."
          />
        </View>
      </View>

      <Card style={styles.filterCard}>
        <View style={styles.filterUpperRow}>
          <View style={styles.filterBlockWide}>
            <Text style={styles.filterLabel}>Search</Text>
            <TextInput
              placeholder="Search by task name"
              placeholderTextColor={colors.dark[400]}
              value={draftSearch}
              onChangeText={setDraftSearch}
              style={styles.input}
            />
          </View>

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Status</Text>
            <Pressable style={styles.dropdownButton} onPress={() => setStatusMenuOpen((current) => !current)}>
              <Text style={styles.dropdownButtonText}>
                {BROWSE_STATUS_OPTIONS.find((item) => item.value === draftStatus)?.label || "All Status"}
              </Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </Pressable>
            {statusMenuOpen ? (
              <View style={styles.dropdownMenu}>
                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                  {BROWSE_STATUS_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setDraftStatus(option.value);
                        setStatusMenuOpen(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        option.value === draftStatus ? styles.dropdownItemActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          option.value === draftStatus ? styles.dropdownItemTextActive : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Budget</Text>
            <View style={styles.moneyRow}>
              <Pressable style={styles.moneyButton} onPress={() => adjustBudget(-10)}>
                <Text style={styles.moneyButtonText}>-</Text>
              </Pressable>
              <TextInput
                placeholder="Max budget"
                placeholderTextColor={colors.dark[400]}
                keyboardType="numeric"
                value={draftBudget}
                onChangeText={setDraftBudget}
                style={styles.moneyInput}
              />
              <Pressable style={styles.moneyButton} onPress={() => adjustBudget(10)}>
                <Text style={styles.moneyButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Button title="Apply" size="sm" onPress={applyFilters} style={styles.ctaButton} />
          <Button title="Reset" size="sm" variant="outline" onPress={resetFilters} style={styles.ctaButton} />
        </View>

        <View style={styles.categoryHeader}>
          <View>
            <Text style={styles.categoryTitle}>Explore Categories</Text>
            <Text style={styles.categoryTip}>Click to filter quickly</Text>
          </View>
        </View>
        <View style={styles.categoryRow}>
          <CategoryChip
            label="All"
            count={activeTasks}
            active={categoryFilter === "ALL"}
            onPress={() => {
              setCategoryFilter("ALL");
              setCurrentPage(1);
            }}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.value}
              label={category.label}
              count={category.count}
              active={categoryFilter === category.value}
              onPress={() => {
                setCategoryFilter(category.value);
                setCurrentPage(1);
              }}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Showing {filteredTasks.length} tasks</Text>
            <Text style={styles.resultsSubtitle}>
              Page {safePage} of {pageCount}. Up to {itemsPerPage} task{itemsPerPage > 1 ? "s" : ""} per page.
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {paginatedTasks.map((task) => {
            const isSaved = savedTaskIds.some((id) => String(id) === String(task.id));
            return (
              <View
                key={String(task.id)}
                style={[styles.gridItem, columns === 1 ? styles.gridItemSingle : styles.gridItemDouble]}
              >
                <TaskCard
                  task={task}
                  isSaved={isSaved}
                  onToggleSave={() => {
                    if (!isAuthenticated) {
                      Alert.alert("Sign in required", "Sign in to save tasks across web and mobile.");
                      return;
                    }
                    if (isSaved) {
                      void unsaveTask(task.id);
                    } else {
                      void saveTask(task.id);
                    }
                  }}
                  onView={() =>
                    router.push({ pathname: "/task-detail", params: { taskId: String(task.id) } })
                  }
                  onBid={
                    user && String(user.role).toUpperCase() === "PROVIDER"
                      ? () => router.push({ pathname: "/task-detail", params: { taskId: String(task.id) } })
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>

        {paginatedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tasks match your current filters.</Text>
            <Text style={styles.emptySubtitle}>Try another search, status, or budget value.</Text>
          </View>
        ) : null}

        <View style={styles.paginationRow}>
          <Button
            title="Previous"
            size="sm"
            variant="outline"
            disabled={safePage <= 1}
            onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
          />
          <View style={styles.pageList}>
            {visiblePages.map((page, index) =>
              page === "..." ? (
                <Text key={`ellipsis-${index}`} style={styles.pageEllipsis}>
                  ...
                </Text>
              ) : (
                <Pressable
                  key={page}
                  onPress={() => setCurrentPage(page)}
                  style={[styles.pageChip, page === safePage ? styles.pageChipActive : null]}
                >
                  <Text style={[styles.pageChipText, page === safePage ? styles.pageChipTextActive : null]}>
                    {page}
                  </Text>
                </Pressable>
              )
            )}
          </View>
          <Button
            title="Next"
            size="sm"
            variant="outline"
            disabled={safePage >= pageCount}
            onPress={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
          />
        </View>
      </Card>
    </MarketplaceShell>
  );
}

function HeroStat({
  value,
  label,
  subLabel,
}: {
  value: string;
  label: string;
  subLabel?: string;
}): React.ReactElement {
  return (
    <View style={styles.heroStatCard}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
      {subLabel ? <Text style={styles.heroStatSubLabel}>{subLabel}</Text> : null}
    </View>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={[styles.categoryChip, active ? styles.categoryChipActive : null]}>
      <Text style={[styles.categoryChipTitle, active ? styles.categoryChipTitleActive : null]}>{label}</Text>
      <Text style={[styles.categoryChipCount, active ? styles.categoryChipCountActive : null]}>{count} tasks</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    backgroundColor: "#123b88",
    padding: 18,
    gap: 10,
  },
  heroEyebrow: {
    color: "#bfdbfe",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  heroBody: {
    color: "#dbeafe",
    fontSize: 14,
    lineHeight: 20,
  },
  heroStatsRow: {
    gap: 10,
    marginTop: 4,
  },
  heroStatCard: {
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 12,
    gap: 2,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#dbeafe",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  heroStatSubLabel: {
    color: "#bfdbfe",
    fontSize: 11,
    lineHeight: 15,
  },
  filterCard: {
    borderColor: "#dce7f7",
  },
  filterUpperRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterBlockWide: {
    width: "100%",
    gap: 6,
  },
  filterBlock: {
    width: "100%",
    gap: 6,
  },
  filterLabel: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  input: {
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 18,
  },
  dropdownButton: {
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonText: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  dropdownChevron: {
    color: colors.dark[500],
    fontSize: 14,
    lineHeight: 18,
  },
  dropdownMenu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: colors.primary[700],
  },
  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moneyButton: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    borderWidth: 1,
    borderColor: colors.dark[200],
    alignItems: "center",
    justifyContent: "center",
  },
  moneyButtonText: {
    color: colors.dark[800],
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  moneyInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 18,
  },
  ctaButton: {
    minWidth: 92,
  },
  categoryHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoryTitle: {
    color: colors.dark[900],
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
  categoryTip: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  categoryChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  categoryChipTitle: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  categoryChipTitleActive: {
    color: colors.primary[700],
  },
  categoryChipCount: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
  },
  categoryChipCountActive: {
    color: colors.primary[700],
  },
  resultsCard: {
    borderColor: "#dce7f7",
  },
  resultsHeader: {
    marginBottom: 10,
  },
  resultsTitle: {
    color: colors.dark[900],
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
  },
  resultsSubtitle: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "100%",
  },
  gridItemSingle: {
    width: "100%",
  },
  gridItemDouble: {
    width: "48.5%",
  },
  emptyState: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderStyle: "dashed",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: {
    color: colors.dark[800],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    color: colors.dark[500],
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  paginationRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pageList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    flex: 1,
  },
  pageChip: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.dark[200],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pageChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  pageChipText: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  pageChipTextActive: {
    color: colors.white,
  },
  pageEllipsis: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
});
