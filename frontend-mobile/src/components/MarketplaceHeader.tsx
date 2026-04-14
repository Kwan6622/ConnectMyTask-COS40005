import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { colors, radius, shadow } from "@/theme/tokens";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import {
  formatCurrency,
  formatDateTime,
  formatTaskStatusLabel,
  getDisplayEmail,
  getDisplayName,
  isAdmin,
  isProvider,
  isRequester,
} from "@/utils/taskUtils";

export type MarketplaceRouteKey =
  | "browse"
  | "post"
  | "saved"
  | "profile"
  | "posted"
  | "progress"
  | "requesterDashboard"
  | "providerDashboard"
  | "myBids"
  | "tracking"
  | "suggested"
  | "notifications"
  | "admin";

export function MarketplaceHeader({
  activeRoute,
}: {
  activeRoute: MarketplaceRouteKey;
}): React.ReactElement {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ q?: string }>();
  const { user, isAuthenticated, logout } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    logout: state.logout,
  }));
  const {
    savedTasks,
    notifications,
    fetchSavedTasks,
    fetchNotifications,
    markNotificationRead,
  } = useTaskStore((state) => ({
    savedTasks: state.savedTasks,
    notifications: state.notifications,
    fetchSavedTasks: state.fetchSavedTasks,
    fetchNotifications: state.fetchNotifications,
    markNotificationRead: state.markNotificationRead,
  }));

  const [headerSearch, setHeaderSearch] = useState(typeof globalParams.q === "string" ? globalParams.q : "");
  const [openPanel, setOpenPanel] = useState<"notifications" | "saved" | "account" | null>(null);

  useEffect(() => {
    if (typeof globalParams.q === "string") {
      setHeaderSearch(globalParams.q);
    }
  }, [globalParams.q]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchSavedTasks();
    void fetchNotifications();
  }, [fetchNotifications, fetchSavedTasks, isAuthenticated]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const navItems = useMemo(
    () => [
      { key: "browse" as const, label: "Browse Tasks", route: "/browse-tasks", visible: true },
      { key: "suggested" as const, label: "Suggested Tasks", route: "/suggested-tasks", visible: isProvider(user) },
      { key: "requesterDashboard" as const, label: "Requester Dashboard", route: "/requester-dashboard", visible: isRequester(user) },
      { key: "providerDashboard" as const, label: "Provider Dashboard", route: "/provider-dashboard", visible: isProvider(user) },
      { key: "post" as const, label: "Post Task", route: "/post-task", visible: isRequester(user) },
      { key: "posted" as const, label: "My Posted Tasks", route: "/my-posted-tasks", visible: isRequester(user) },
      { key: "tracking" as const, label: "My Assigned Tasks", route: "/task-progress", visible: isProvider(user) },
      { key: "saved" as const, label: "Saved Tasks", route: "/saved-tasks", visible: isProvider(user) },
      { key: "myBids" as const, label: "My Bids", route: "/my-bids", visible: isProvider(user) },
      { key: "notifications" as const, label: "Notifications", route: "/notifications", visible: isRequester(user) || isProvider(user) },
      { key: "progress" as const, label: "Task Progress", route: "/task-progress", visible: isRequester(user) || isProvider(user) },
      { key: "admin" as const, label: "Admin Dashboard", route: "/admin-dashboard", visible: isAdmin(user) },
    ],
    [user]
  );

  const accountOnline = isAuthenticated;
  const accountName = getDisplayName(user);
  const accountEmail = getDisplayEmail(user);
  const bellIcon = "\u{1F514}";
  const savedIcon = "\u{1F516}";
  const userIcon = "\u{1F464}";

  const resolveNotificationRoute = (message: string, taskId: string | number) => {
    const normalized = String(message || "").toLowerCase();
    if (normalized.includes("tracking") || normalized.includes("location") || normalized.includes("gps")) {
      return { pathname: "/task-tracking", params: { taskId: String(taskId) } } as const;
    }
    if (normalized.includes("progress") || normalized.includes("completed") || normalized.includes("milestone")) {
      return { pathname: "/task-progress", params: { taskId: String(taskId) } } as const;
    }
    return { pathname: "/task-detail", params: { taskId: String(taskId) } } as const;
  };

  const handleSearchSubmit = (): void => {
    router.push({
      pathname: "/browse-tasks",
      params: headerSearch.trim() ? { q: headerSearch.trim() } : {},
    });
    setOpenPanel(null);
  };

  const handleProtectedOpen = (
    target:
      | "/saved-tasks"
      | "/profile"
      | "/my-posted-tasks"
      | "/requester-dashboard"
      | "/provider-dashboard"
      | "/my-bids"
      | "/notifications"
      | "/admin-dashboard"
  ): void => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    router.push(target);
    setOpenPanel(null);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.brandRow}>
        <Pressable style={styles.logoRow} onPress={() => router.push("/browse-tasks")}>
          <View style={styles.logoBlock}>
            <Text style={styles.logoText}>CMT</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ConnectMyTask</Text>
            <Text style={styles.brandSubtitle}>AI-Powered Matching</Text>
          </View>
        </Pressable>
        <Badge label={accountOnline ? "Online" : "Offline"} variant={accountOnline ? "success" : "danger"} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
        {navItems.filter((item) => item.visible).map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              router.push(item.route as any);
              setOpenPanel(null);
            }}
            style={[styles.navChip, activeRoute === item.key ? styles.navChipActive : null]}
          >
            <Text style={[styles.navChipText, activeRoute === item.key ? styles.navChipTextActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.utilityCard}>
        <View style={[styles.searchRow, compact ? styles.searchRowCompact : null]}>
          <TextInput
            placeholder="Search tasks"
            placeholderTextColor={colors.dark[400]}
            value={headerSearch}
            onChangeText={setHeaderSearch}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          <Button
            title="Search"
            size="sm"
            onPress={handleSearchSubmit}
            style={[styles.searchButton, compact ? styles.searchButtonCompact : null]}
          />
        </View>

        <View style={[styles.actionRow, compact ? styles.actionRowCompact : null]}>
          <Pressable
            onPress={() => setOpenPanel((current) => (current === "notifications" ? null : "notifications"))}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>{bellIcon}</Text>
            {unreadCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setOpenPanel((current) => (current === "saved" ? null : "saved"))}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>{savedIcon}</Text>
            {savedTasks.length > 0 ? (
              <View style={[styles.countBadge, styles.savedBadge]}>
                <Text style={styles.countBadgeText}>{savedTasks.length > 9 ? "9+" : savedTasks.length}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setOpenPanel((current) => (current === "account" ? null : "account"))}
            style={[styles.accountButton, compact ? styles.accountButtonCompact : null]}
          >
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>{userIcon}</Text>
              <View style={[styles.statusDot, accountOnline ? styles.statusOnline : styles.statusOffline]} />
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountName} numberOfLines={1}>
                {accountName}
              </Text>
              <Text style={styles.accountMeta}>{accountOnline ? "Online" : "Offline"}</Text>
            </View>
            <Text style={styles.chevronText}>▾</Text>
          </Pressable>
        </View>
      </View>

      {openPanel === "notifications" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Notifications</Text>
          {!isAuthenticated ? (
            <Text style={styles.panelEmpty}>Sign in to view your notifications.</Text>
          ) : notifications.length === 0 ? (
            <Text style={styles.panelEmpty}>No new notifications.</Text>
          ) : (
            notifications.slice(0, 5).map((item) => (
              <Pressable
                key={String(item.id)}
                style={styles.panelItem}
                onPress={() => {
                  void markNotificationRead(item.id);
                  if (item.task?.id != null) {
                    router.push(resolveNotificationRoute(item.message, item.task.id) as any);
                  }
                  setOpenPanel(null);
                }}
              >
                <Text style={styles.panelItemTitle}>
                  {item.sender?.name ? `Provider ${item.sender.name} wants to contact you` : item.title || "New notification"}
                </Text>
                <Text style={styles.panelItemBody}>{item.message}</Text>
                <Text style={styles.panelItemMeta}>{formatDateTime(item.createdAt)}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {openPanel === "saved" ? (
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Saved Tasks</Text>
            <Pressable onPress={() => handleProtectedOpen("/saved-tasks")}>
              <Text style={styles.linkAction}>View all</Text>
            </Pressable>
          </View>
          {!isAuthenticated ? (
            <Text style={styles.panelEmpty}>Sign in to keep saved tasks in sync.</Text>
          ) : savedTasks.length === 0 ? (
            <Text style={styles.panelEmpty}>No saved tasks yet.</Text>
          ) : (
            savedTasks.slice(0, 4).map((item) => (
              <Pressable
                key={String(item.id)}
                style={styles.panelItem}
                onPress={() => {
                  router.push({ pathname: "/task-detail", params: { taskId: String(item.task.id) } });
                  setOpenPanel(null);
                }}
              >
                <Text style={styles.panelItemTitle}>{item.task.title}</Text>
                <Text style={styles.panelItemBody}>
                  {formatTaskStatusLabel(item.task.status)} · {formatCurrency(Number(item.task.budget || 0))}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {openPanel === "account" ? (
        <View style={styles.panel}>
          <Text style={styles.accountEmail}>{accountEmail}</Text>
          <PanelAction label="Profile" onPress={() => handleProtectedOpen("/profile")} />
          {isRequester(user) ? <PanelAction label="Requester Dashboard" onPress={() => handleProtectedOpen("/requester-dashboard")} /> : null}
          {isProvider(user) ? <PanelAction label="Provider Dashboard" onPress={() => handleProtectedOpen("/provider-dashboard")} /> : null}
          {isAdmin(user) ? <PanelAction label="Admin Dashboard" onPress={() => handleProtectedOpen("/admin-dashboard")} /> : null}
          {isRequester(user) ? <PanelAction label="My Posted Tasks" onPress={() => handleProtectedOpen("/my-posted-tasks")} /> : null}
          {isProvider(user) ? <PanelAction label="My Bids" onPress={() => handleProtectedOpen("/my-bids")} /> : null}
          <PanelAction label="Notifications" onPress={() => handleProtectedOpen("/notifications")} />
          <PanelAction label="Saved Tasks" onPress={() => handleProtectedOpen("/saved-tasks")} />
          <Pressable
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/sign-in");
                return;
              }
              logout();
              router.push("/browse-tasks");
              setOpenPanel(null);
            }}
            style={[styles.panelAction, styles.logoutAction]}
          >
            <Text style={[styles.panelActionText, styles.logoutText]}>
              {isAuthenticated ? "Logout" : "Sign In"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function PanelAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.panelAction, pressed ? styles.panelActionPressed : null]}
    >
      <Text style={styles.panelActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logoBlock: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "#0f3f8f",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
  brandTitle: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  brandSubtitle: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  navRow: {
    gap: 8,
    paddingRight: 8,
  },
  navChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  navChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  navChipText: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  navChipTextActive: {
    color: colors.primary[700],
  },
  utilityCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dark[100],
    backgroundColor: colors.white,
    padding: 14,
    gap: 12,
    ...shadow.soft,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchRowCompact: {
    flexDirection: "column",
  },
  searchInput: {
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
  searchButton: {
    minWidth: 86,
  },
  searchButtonCompact: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionRowCompact: {
    flexWrap: "wrap",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark[50],
  },
  iconButtonText: {
    fontSize: 20,
    lineHeight: 24,
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 4,
    backgroundColor: colors.danger[600],
    alignItems: "center",
    justifyContent: "center",
  },
  savedBadge: {
    backgroundColor: colors.primary[600],
  },
  countBadgeText: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  accountButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.dark[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  accountButtonCompact: {
    minWidth: "100%",
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  accountAvatarText: {
    fontSize: 17,
    lineHeight: 20,
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusOnline: {
    backgroundColor: colors.success[500],
  },
  statusOffline: {
    backgroundColor: colors.danger[500],
  },
  accountCopy: {
    flex: 1,
  },
  accountName: {
    color: colors.dark[900],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  accountMeta: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
  },
  chevronText: {
    color: colors.dark[500],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  panel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dark[100],
    backgroundColor: colors.white,
    padding: 14,
    gap: 10,
    ...shadow.soft,
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    color: colors.dark[900],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  panelEmpty: {
    color: colors.dark[500],
    fontSize: 13,
    lineHeight: 18,
  },
  panelItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[100],
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 4,
  },
  panelItemTitle: {
    color: colors.dark[900],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  panelItemBody: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 17,
  },
  panelItemMeta: {
    color: colors.dark[400],
    fontSize: 11,
    lineHeight: 15,
  },
  accountEmail: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
  panelAction: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  panelActionPressed: {
    backgroundColor: colors.dark[50],
  },
  panelActionText: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  logoutAction: {
    borderColor: colors.danger[200],
    backgroundColor: colors.danger[50],
  },
  logoutText: {
    color: colors.danger[700],
  },
  linkAction: {
    color: colors.primary[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
});
