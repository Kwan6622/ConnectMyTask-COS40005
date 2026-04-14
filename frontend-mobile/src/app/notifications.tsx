import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors, radius } from "@/theme/tokens";
import { formatDateTime } from "@/utils/taskUtils";

export default function NotificationsScreen(): React.ReactElement {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { notifications, fetchNotifications, markNotificationRead } = useTaskStore((state) => ({
    notifications: state.notifications,
    fetchNotifications: state.fetchNotifications,
    markNotificationRead: state.markNotificationRead,
  }));

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchNotifications();
  }, [fetchNotifications, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <MarketplaceShell activeRoute="notifications">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Sign in to view notifications</Text>
            <Text style={styles.body}>Notifications are synced from the same backend used by web.</Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="notifications">
      <Card>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.body}>Tap a notification to open the linked task screen.</Text>
          </View>
          <Button title="Refresh" size="sm" variant="outline" onPress={() => void fetchNotifications()} />
        </View>
      </Card>

      {notifications.length === 0 ? (
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>No notifications</Text>
            <Text style={styles.body}>You are all caught up.</Text>
          </View>
        </Card>
      ) : (
        notifications.map((item) => (
          <Card key={String(item.id)}>
            <Pressable
              onPress={() => {
                void markNotificationRead(item.id);
                if (item.task?.id != null) {
                  router.push({ pathname: "/task-detail", params: { taskId: String(item.task.id) } });
                }
              }}
              style={styles.notificationItem}
            >
              <View style={styles.notificationTop}>
                <Text style={styles.notificationTitle}>{item.title || "Task update"}</Text>
                {!item.isRead ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.notificationBody}>{item.message}</Text>
              <Text style={styles.notificationMeta}>{formatDateTime(item.createdAt)}</Text>
            </Pressable>
          </Card>
        ))
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
  notificationItem: {
    gap: 6,
  },
  notificationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTitle: {
    color: colors.dark[900],
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    flex: 1,
  },
  notificationBody: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
  },
  notificationMeta: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary[600],
    marginLeft: 8,
  },
  centerBox: {
    alignItems: "center",
    gap: 8,
  },
});
