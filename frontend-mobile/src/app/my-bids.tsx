import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Bid } from "@/types";
import { colors } from "@/theme/tokens";
import { formatCurrency, formatDateTime, isProvider } from "@/utils/taskUtils";

export default function MyBidsScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !isProvider(user)) return;
    let mounted = true;

    async function loadMyBids() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.bids.getProviderMe();
        const list = Array.isArray(response.data) ? response.data : response.data?.items || response.data?.data || [];
        if (mounted) {
          setBids(list);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.message || "Cannot load your bids.");
          setBids([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMyBids();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user]);

  const stats = useMemo(() => {
    const pending = bids.filter((item) => String(item.status) === "PENDING").length;
    const accepted = bids.filter((item) => String(item.status) === "ACCEPTED").length;
    const rejected = bids.filter((item) => String(item.status) === "REJECTED").length;
    return { pending, accepted, rejected };
  }, [bids]);

  if (!isAuthenticated || !isProvider(user)) {
    return (
      <MarketplaceShell activeRoute="myBids">
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>Provider access required</Text>
            <Text style={styles.body}>Only provider accounts can view and manage bid history.</Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="myBids">
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>My Bids</Text>
          <Text style={styles.body}>Track submitted bids and statuses in one place.</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.statRow}>
          <Stat label="Pending" value={String(stats.pending)} />
          <Stat label="Accepted" value={String(stats.accepted)} />
          <Stat label="Rejected" value={String(stats.rejected)} />
        </View>
      </Card>

      {isLoading ? (
        <Card>
          <Text style={styles.body}>Loading bids...</Text>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {!isLoading && bids.length === 0 ? (
        <Card>
          <View style={styles.centerBox}>
            <Text style={styles.title}>No bids yet</Text>
            <Text style={styles.body}>Go to Browse Tasks and submit your first bid.</Text>
            <Button title="Browse Tasks" onPress={() => router.push("/browse-tasks")} />
          </View>
        </Card>
      ) : (
        bids.map((bid) => {
          const amount = Number((bid as any).price ?? bid.amount ?? 0);
          const taskTitle = (bid as any)?.task?.title || `Task #${bid.taskId}`;
          return (
            <Card key={String(bid.id)}>
              <View style={styles.bidItem}>
                <Text style={styles.bidTitle}>{taskTitle}</Text>
                <Text style={styles.bidMeta}>Status: {String(bid.status || "PENDING")}</Text>
                <Text style={styles.bidMeta}>Amount: {formatCurrency(amount)}</Text>
                <Text style={styles.bidMeta}>Created: {formatDateTime(bid.createdAt)}</Text>
                {bid.message ? <Text style={styles.bidMessage}>{bid.message}</Text> : null}
              </View>
            </Card>
          );
        })
      )}
    </MarketplaceShell>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
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
  errorText: {
    color: colors.danger[600],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.dark[50],
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  bidItem: {
    gap: 4,
  },
  bidTitle: {
    color: colors.dark[900],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  bidMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 17,
  },
  bidMessage: {
    marginTop: 4,
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
  },
  centerBox: {
    gap: 8,
    alignItems: "center",
  },
});

