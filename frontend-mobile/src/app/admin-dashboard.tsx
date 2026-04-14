import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { colors, radius } from "@/theme/tokens";
import { formatCurrency, isAdmin } from "@/utils/taskUtils";

type AdminTab = "overview" | "tasks" | "certificates" | "payments" | "disputes";

export default function AdminDashboardScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [suspiciousTasks, setSuspiciousTasks] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, tasksRes, suspiciousRes, certsRes, paymentsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getTasks(),
        api.admin.getSuspiciousTasks(),
        api.admin.getCertificates(),
        api.admin.getPayments(),
      ]);
      setStats(statsRes.data || null);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setSuspiciousTasks(Array.isArray(suspiciousRes.data) ? suspiciousRes.data : []);
      setCertificates(Array.isArray(certsRes.data) ? certsRes.data : []);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
    } catch (error: any) {
      Alert.alert("Admin load failed", error?.response?.data?.message || "Cannot load admin dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin(user)) return;
    void loadAdminData();
  }, [isAuthenticated, loadAdminData, user]);

  const overviewCards = useMemo(
    () => [
      { label: "Total Users", value: String(stats?.totalUsers ?? 0) },
      { label: "Active Tasks", value: String(stats?.activeTasks ?? 0) },
      { label: "Suspicious Tasks", value: String(stats?.suspiciousTasks ?? 0) },
      { label: "Escrow-held Payments", value: String(stats?.escrowHeldPayments ?? 0) },
      { label: "Pending Certificates", value: String(stats?.pendingCertificates ?? 0) },
      { label: "Disputes", value: String(stats?.disputes ?? 0) },
      { label: "Escrow Held Amount", value: formatCurrency(Number(stats?.totalEscrowHeldAmount ?? 0)) },
      { label: "Platform Revenue (20%)", value: formatCurrency(Number(stats?.totalPlatformRevenue ?? 0)) },
    ],
    [stats]
  );

  if (!isAuthenticated || !isAdmin(user)) {
    return (
      <MarketplaceShell activeRoute="admin">
        <Card>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Admin access required</Text>
            <Text style={styles.promptBody}>This page is restricted to admin accounts only.</Text>
            <Button title="Back to Browse Tasks" onPress={() => router.replace("/browse-tasks")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  const handleDeleteTask = async (taskId: string | number): Promise<void> => {
    try {
      await api.admin.deleteTask(taskId);
      Alert.alert("Updated", "Task soft-deleted.");
      await loadAdminData();
    } catch (error: any) {
      Alert.alert("Delete failed", error?.response?.data?.message || "Cannot delete task.");
    }
  };

  const handleReviewTask = async (taskId: string | number): Promise<void> => {
    try {
      await api.admin.reviewTask(taskId);
      Alert.alert("Updated", "Task marked as reviewed.");
      await loadAdminData();
    } catch (error: any) {
      Alert.alert("Review failed", error?.response?.data?.message || "Cannot review task.");
    }
  };

  const handleCertificateAction = async (
    certificateId: string | number,
    action: "verify" | "reject"
  ): Promise<void> => {
    try {
      if (action === "verify") {
        await api.admin.verifyCertificate(certificateId);
      } else {
        await api.admin.rejectCertificate(certificateId);
      }
      Alert.alert("Updated", `Certificate ${action}d.`);
      await loadAdminData();
    } catch (error: any) {
      Alert.alert("Certificate update failed", error?.response?.data?.message || "Cannot update certificate status.");
    }
  };

  const handleReleasePayment = async (paymentId: string | number): Promise<void> => {
    try {
      await api.admin.releasePayment(paymentId);
      Alert.alert("Updated", "Escrow released.");
      await loadAdminData();
    } catch (error: any) {
      Alert.alert("Release failed", error?.response?.data?.message || "Cannot release escrow.");
    }
  };

  return (
    <MarketplaceShell activeRoute="admin">
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerBody}>Manage suspicious tasks, certificates, and escrow payments using live backend data.</Text>
          </View>
          <Button title={isLoading ? "Refreshing..." : "Refresh"} size="sm" onPress={() => void loadAdminData()} />
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {[
          { id: "overview", label: "Overview" },
          { id: "tasks", label: "Tasks" },
          { id: "certificates", label: "Certificates" },
          { id: "payments", label: "Payments / Escrow" },
          { id: "disputes", label: "Disputes / Reports" },
        ].map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTab(item.id as AdminTab)}
            style={[styles.tabChip, tab === item.id ? styles.tabChipActive : null]}
          >
            <Text style={[styles.tabChipText, tab === item.id ? styles.tabChipTextActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "overview" ? (
        <View style={styles.grid}>
          {overviewCards.map((card) => (
            <Card key={card.label}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {tab === "tasks" ? (
        <View style={styles.grid}>
          <Card title="All Tasks">
            <View style={styles.listWrap}>
              {tasks.length === 0 ? <Text style={styles.emptyText}>No tasks found.</Text> : null}
              {tasks.map((task) => (
                <View key={String(task.id)} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  <Text style={styles.itemMeta}>{task.category} · {task.status}</Text>
                  <Text style={styles.itemMeta}>Requester: {task.createdBy?.name || "-"}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card title="Suspicious / Flagged Tasks">
            <View style={styles.listWrap}>
              {suspiciousTasks.length === 0 ? <Text style={styles.emptyText}>No suspicious tasks.</Text> : null}
              {suspiciousTasks.map((task) => (
                <View key={String(task.id)} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  <Text style={styles.riskMeta}>{task.suspiciousReason || "Flagged as suspicious"}</Text>
                  <Text style={styles.itemMeta}>Posted by: {task.createdBy?.name || "Unknown"}</Text>
                  <View style={styles.actionRow}>
                    <Button title="Mark Reviewed" size="sm" variant="outline" onPress={() => void handleReviewTask(task.id)} />
                    <Button title="Soft Delete" size="sm" variant="outline" onPress={() => void handleDeleteTask(task.id)} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {tab === "certificates" ? (
        <Card title="Provider Certificates">
          <View style={styles.listWrap}>
            {certificates.length === 0 ? <Text style={styles.emptyText}>No certificates.</Text> : null}
            {certificates.map((cert) => (
              <View key={String(cert.id)} style={styles.listItem}>
                <Text style={styles.itemTitle}>{cert.title}</Text>
                <Text style={styles.itemMeta}>{cert.certificateType}</Text>
                <Text style={styles.itemMeta}>
                  Provider: {cert.provider?.name || "-"} ({cert.provider?.email || "-"})
                </Text>
                <Text style={styles.itemMeta}>Status: {cert.verificationStatus}</Text>
                <Pressable onPress={() => void Linking.openURL(String(cert.fileUrl || ""))}>
                  <Text style={styles.linkText}>Open document</Text>
                </Pressable>
                <View style={styles.actionRow}>
                  <Button title="Verify" size="sm" variant="outline" onPress={() => void handleCertificateAction(cert.id, "verify")} />
                  <Button title="Reject" size="sm" variant="outline" onPress={() => void handleCertificateAction(cert.id, "reject")} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {tab === "payments" ? (
        <Card title="Escrow & Payment Transactions">
          <View style={styles.listWrap}>
            {payments.length === 0 ? <Text style={styles.emptyText}>No payments.</Text> : null}
            {payments.map((payment) => (
              <View key={String(payment.id)} style={styles.listItem}>
                <Text style={styles.itemTitle}>{payment.task?.title || `Task #${payment.taskId}`}</Text>
                <Text style={styles.itemMeta}>Requester: {payment.payer?.name || "-"}</Text>
                <Text style={styles.itemMeta}>Provider: {payment.provider?.name || "-"}</Text>
                <Text style={styles.itemMeta}>
                  Total paid: <Text style={styles.itemStrong}>{formatCurrency(Number(payment.totalAmount || payment.amount || 0))}</Text>
                </Text>
                <Text style={styles.itemMeta}>
                  Platform fee (20%): <Text style={styles.itemStrong}>{formatCurrency(Number(payment.platformFeeAmount || 0))}</Text>
                </Text>
                <Text style={styles.itemMeta}>
                  Provider payout (80%): <Text style={styles.itemStrong}>{formatCurrency(Number(payment.providerPayoutAmount || 0))}</Text>
                </Text>
                <Text style={styles.itemMeta}>Lifecycle: {payment.lifecycleStatus || "PENDING"}</Text>
                {payment.lifecycleStatus === "ESCROW_HELD" ? (
                  <Button title="Release Escrow" size="sm" onPress={() => void handleReleasePayment(payment.id)} />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {tab === "disputes" ? (
        <Card>
          <Text style={styles.disputeText}>
            Use task detail + dispute workflow to resolve reports. Live dispute count appears in Overview.
          </Text>
        </Card>
      ) : null}
    </MarketplaceShell>
  );
}

const styles = StyleSheet.create({
  promptBox: {
    alignItems: "center",
    gap: 8,
  },
  promptTitle: {
    color: colors.dark[900],
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  promptBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  headerTitle: {
    color: colors.dark[900],
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  headerBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  tabRow: {
    gap: 8,
    paddingRight: 8,
  },
  tabChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  tabChipText: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  tabChipTextActive: {
    color: colors.primary[700],
  },
  grid: {
    gap: 12,
  },
  cardLabel: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  cardValue: {
    color: colors.dark[900],
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    marginTop: 6,
  },
  listWrap: {
    gap: 10,
  },
  listItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 4,
  },
  itemTitle: {
    color: colors.dark[900],
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  itemMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  itemStrong: {
    color: colors.dark[900],
    fontWeight: "700",
  },
  riskMeta: {
    color: colors.danger[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  linkText: {
    color: colors.primary[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  emptyText: {
    color: colors.dark[500],
    fontSize: 13,
    lineHeight: 18,
  },
  disputeText: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
});
