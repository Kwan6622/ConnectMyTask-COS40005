import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { Bid } from "@/types";
import { colors, radius } from "@/theme/tokens";
import {
  formatCategoryLabel,
  formatCurrency,
  formatDate,
  formatTaskStatusLabel,
  getDisplayName,
  getTaskDueDate,
  getTaskDisplayBudget,
  isAdmin,
  isProvider,
} from "@/utils/taskUtils";

export default function TaskDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { currentTask, isLoading, fetchTaskById, saveTask, unsaveTask, savedTaskIds } = useTaskStore((state) => ({
    currentTask: state.currentTask,
    isLoading: state.isLoading,
    fetchTaskById: state.fetchTaskById,
    saveTask: state.saveTask,
    unsaveTask: state.unsaveTask,
    savedTaskIds: state.savedTaskIds,
  }));

  const [taskBids, setTaskBids] = useState<Bid[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [assigningBidId, setAssigningBidId] = useState<string | number | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  useEffect(() => {
    if (!taskId) return;
    void fetchTaskById(taskId);
  }, [fetchTaskById, taskId]);

  useEffect(() => {
    if (!taskId) return;
    const resolvedTaskId = taskId;
    let mounted = true;

    async function loadBids() {
      try {
        const response = await api.bids.getAll(resolvedTaskId);
        const payload = Array.isArray(response.data) ? response.data : response.data?.items || response.data?.data || [];
        if (mounted) setTaskBids(payload);
      } catch {
        if (mounted) setTaskBids([]);
      }
    }

    void loadBids();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const resolvedTaskId = taskId;
    let mounted = true;

    async function loadPayments() {
      try {
        const response = await api.payments.getByTask(resolvedTaskId);
        const result = response.data || {};
        const list = Array.isArray(result) ? result : result.payments || result.items || result.data || [];
        if (mounted) setPaymentHistory(list);
      } catch {
        if (mounted) setPaymentHistory([]);
      }
    }

    void loadPayments();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  const isSaved = useMemo(
    () => savedTaskIds.some((id) => String(id) === String(currentTask?.id)),
    [currentTask?.id, savedTaskIds]
  );

  const bidCount = currentTask?._count?.bids ?? currentTask?.bids?.length ?? taskBids.length;
  const maxBids = Math.min(Number(currentTask?.maxBids || 30), 100);
  const isBidLimitReached = bidCount >= maxBids || bidCount >= 100;
  const canBid =
    isAuthenticated &&
    isProvider(user) &&
    currentTask != null &&
    ["OPEN", "BIDDING"].includes(String(currentTask.status || "")) &&
    !isBidLimitReached;

  const isRequesterUser =
    isAuthenticated && user != null && ["REQUESTER", "CLIENT"].includes(String(user.role || "").toUpperCase());
  const canAssignProvider =
    isRequesterUser && currentTask != null && ["OPEN", "BIDDING"].includes(String(currentTask.status || ""));

  const submitBid = async (): Promise<void> => {
    if (!taskId) return;
    const parsedAmount = Number(bidAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid bid", "Enter a valid bid amount greater than 0.");
      return;
    }

    setIsSubmittingBid(true);
    try {
      await api.bids.create(taskId, {
        amount: parsedAmount,
        message: bidMessage.trim() || undefined,
      });
      setBidAmount("");
      setBidMessage("");
      const response = await api.bids.getAll(taskId);
      const payload = Array.isArray(response.data) ? response.data : response.data?.items || response.data?.data || [];
      setTaskBids(payload);
      Alert.alert("Success", "Your bid has been submitted.");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cannot submit bid right now.";
      Alert.alert("Bid failed", message);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const assignBid = async (bidId: string | number): Promise<void> => {
    if (!taskId || !canAssignProvider) return;
    setAssigningBidId(bidId);
    try {
      await api.tasks.assignProvider(taskId, Number(bidId));
      await fetchTaskById(taskId);
      const response = await api.bids.getAll(taskId);
      const payload = Array.isArray(response.data) ? response.data : response.data?.items || response.data?.data || [];
      setTaskBids(payload);
      Alert.alert("Provider assigned", "Task moved to assigned workflow.");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cannot assign provider right now.";
      Alert.alert("Assign failed", message);
    } finally {
      setAssigningBidId(null);
    }
  };

  const createPayment = async (flow: "ESCROW_DEPOSIT" | "DIRECT_PAYMENT"): Promise<void> => {
    if (!currentTask) return;
    setIsCreatingPayment(true);
    try {
      const response = await api.payments.create({
        taskId: Number(currentTask.id),
        method: "STRIPE",
        flow,
      });
      const paymentUrl = response.data?.paymentUrl;
      if (paymentUrl) {
        await Linking.openURL(paymentUrl);
        Alert.alert("Redirecting", "Opening Stripe checkout.");
      } else {
        Alert.alert("Payment initialized", "Payment session was created.");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cannot initialize payment for this task.";
      Alert.alert("Payment error", message);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (!taskId) {
    return (
      <MarketplaceShell activeRoute="browse">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Task not found</Text>
            <Text style={styles.body}>Missing task id in route params.</Text>
            <Button title="Back to Browse" onPress={() => router.replace("/browse-tasks")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  if (isLoading && !currentTask) {
    return (
      <MarketplaceShell activeRoute="browse">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Loading task...</Text>
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  if (!currentTask) {
    return (
      <MarketplaceShell activeRoute="browse">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Task unavailable</Text>
            <Text style={styles.body}>Unable to load this task from server.</Text>
            <Button title="Back to Browse" onPress={() => router.replace("/browse-tasks")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  const budget = getTaskDisplayBudget(currentTask);
  const dueDate = getTaskDueDate(currentTask);
  const postedBy = getDisplayName(currentTask.createdBy || currentTask.client);
  const canSeeSuspiciousRisk = isProvider(user) || isAdmin(user);

  return (
    <MarketplaceShell activeRoute="browse">
      <View style={styles.headerRow}>
        <Button title="Back" size="sm" variant="outline" onPress={() => router.back()} />
        <Button
          title={isSaved ? "Unsave" : "Save"}
          size="sm"
          variant={isSaved ? "ghost" : "outline"}
          onPress={() => (isSaved ? void unsaveTask(currentTask.id) : void saveTask(currentTask.id))}
        />
      </View>

      <Card>
        <View style={styles.detailBody}>
          <View style={styles.topRow}>
            <Text style={styles.title}>{currentTask.title}</Text>
            <Text style={styles.budget}>{formatCurrency(budget)}</Text>
          </View>
          <View style={styles.badgeRow}>
            <Badge label={formatTaskStatusLabel(currentTask.status)} variant="primary" />
            <Badge label={formatCategoryLabel(String(currentTask.category))} variant="neutral" />
            {currentTask.isSuspicious && canSeeSuspiciousRisk ? <Badge label="Risk flagged" variant="warning" /> : null}
          </View>
          <Text style={styles.body}>{currentTask.description}</Text>
          <View style={styles.infoBox}>
            <InfoRow label="Location" value={currentTask.location} />
            <InfoRow label="Posted by" value={postedBy} />
            <InfoRow label="Due date" value={dueDate ? formatDate(dueDate) : "Flexible"} />
            <InfoRow label="Created" value={formatDate(currentTask.createdAt)} />
            <InfoRow label="Bid slots" value={`${bidCount}/${maxBids}`} />
            {isBidLimitReached ? <InfoRow label="Bidding" value="Closed" /> : null}
          </View>
        </View>
      </Card>

      <Card title="Actions">
        <View style={styles.actionRow}>
          <Button
            title="Task Progress"
            variant="outline"
            onPress={() => router.push({ pathname: "/task-progress", params: { taskId: String(currentTask.id) } })}
            style={styles.actionButton}
          />
          <Button
            title="Tracking"
            variant="outline"
            onPress={() => router.push({ pathname: "/task-tracking", params: { taskId: String(currentTask.id) } })}
            style={styles.actionButton}
          />
          <Button title="Contact Client" variant="outline" onPress={() => Alert.alert("Coming soon")} style={styles.actionButton} />
        </View>
      </Card>

      {isRequesterUser ? (
        <Card title="Payment / Escrow">
          <View style={styles.actionRow}>
            <Button
              title={isCreatingPayment ? "Processing..." : "Deposit Escrow"}
              onPress={() => void createPayment("ESCROW_DEPOSIT")}
              loading={isCreatingPayment}
              style={styles.actionButton}
            />
            <Button
              title={isCreatingPayment ? "Processing..." : "Pay Now"}
              variant="outline"
              onPress={() => void createPayment("DIRECT_PAYMENT")}
              loading={isCreatingPayment}
              style={styles.actionButton}
            />
          </View>
          <View style={styles.paymentList}>
            <Text style={styles.sectionSmallTitle}>Payment History</Text>
            {paymentHistory.length === 0 ? (
              <Text style={styles.emptyText}>No payment transactions yet.</Text>
            ) : (
              paymentHistory.slice(0, 5).map((item) => (
                <View key={String(item.id)} style={styles.paymentItem}>
                  <Text style={styles.paymentItemTitle}>
                    {String(item.type || "PAYMENT")} · {formatCurrency(Number(item.amount || 0))}
                  </Text>
                  <Text style={styles.paymentItemMeta}>Status: {String(item.status || "PENDING")}</Text>
                </View>
              ))
            )}
          </View>
        </Card>
      ) : null}

      <Card title="Bids">
        <View style={styles.bidSection}>
          {canBid ? (
            <View style={styles.bidForm}>
              <Input
                label="Your Offer (VND)"
                placeholder="e.g. 200000"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
              />
              <Input
                label="Message (optional)"
                placeholder="Write a short proposal"
                value={bidMessage}
                onChangeText={setBidMessage}
                multiline
                numberOfLines={3}
              />
              <Button
                title={isSubmittingBid ? "Submitting..." : "Place Bid"}
                onPress={() => void submitBid()}
                loading={isSubmittingBid}
              />
            </View>
          ) : (
            <Text style={styles.body}>
              {isBidLimitReached
                ? "This task is no longer accepting bids."
                : "Sign in as a provider to place a bid on this task."}
            </Text>
          )}

          <ScrollView style={styles.bidList} nestedScrollEnabled>
            {taskBids.length === 0 ? (
              <Text style={styles.emptyText}>No bids yet.</Text>
            ) : (
              taskBids.map((bid) => {
                const amount = Number((bid as any).price ?? bid.amount ?? 0);
                const bidProvider = (bid as any)?.provider?.name || "Provider";
                return (
                  <View key={String(bid.id)} style={styles.bidItem}>
                    <View style={styles.topRow}>
                      <Text style={styles.bidProvider}>{bidProvider}</Text>
                      <Text style={styles.bidPrice}>{formatCurrency(amount)}</Text>
                    </View>
                    <Text style={styles.bidMeta}>Status: {String(bid.status || "PENDING")}</Text>
                    {bid.message ? <Text style={styles.bidMessage}>{bid.message}</Text> : null}
                    {canAssignProvider ? (
                      <View style={styles.assignWrap}>
                        <Button
                          title={assigningBidId === bid.id ? "Assigning..." : "Assign Provider"}
                          size="sm"
                          onPress={() => void assignBid(bid.id)}
                          loading={assigningBidId === bid.id}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Card>
    </MarketplaceShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  detailBody: {
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.dark[900],
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  body: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 20,
  },
  budget: {
    color: colors.success[700],
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[200],
    gap: 2,
  },
  infoLabel: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  bidSection: {
    gap: 12,
  },
  bidForm: {
    gap: 10,
  },
  paymentList: {
    marginTop: 12,
    gap: 8,
  },
  sectionSmallTitle: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  paymentItem: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 10,
    gap: 2,
  },
  paymentItemTitle: {
    color: colors.dark[800],
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  paymentItemMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  bidList: {
    maxHeight: 280,
  },
  bidItem: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  bidProvider: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  bidPrice: {
    color: colors.success[700],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  bidMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  bidMessage: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 17,
  },
  assignWrap: {
    marginTop: 8,
  },
  emptyText: {
    color: colors.dark[500],
    fontSize: 13,
    lineHeight: 18,
  },
  centerBox: {
    alignItems: "center",
    gap: 8,
  },
});
