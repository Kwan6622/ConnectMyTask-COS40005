import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Task, TaskStatus } from "@/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { colors } from "@/theme/tokens";
import { formatCategoryLabel, formatCurrency, formatDate, formatTaskStatusLabel, normalizeTaskStatus } from "@/utils/taskUtils";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onView?: () => void;
  onBid?: () => void;
}

function getStatusVariant(status: TaskStatus): "primary" | "warning" | "success" | "danger" | "neutral" {
  const normalized = normalizeTaskStatus(status);
  if (normalized === "OPEN") return "primary";
  if (normalized === "PENDING") return "warning";
  if (normalized === "COMPLETED") return "success";
  if (normalized === "CANCELLED") return "danger";
  return "neutral";
}

export function TaskCard({ task, onPress, onView, onBid }: TaskCardProps): React.ReactElement {
  const normalizedStatus = normalizeTaskStatus(task.status);
  const showBidActions = normalizedStatus === "OPEN" || normalizedStatus === "PENDING";
  const displayBudget = task.aiSuggestedPrice ?? task.budget;
  const handleView = onView || onPress || (() => undefined);
  const handleBid = onBid || (() => undefined);

  return (
    <View style={styles.container}>
      <Card
        style={styles.card}
        contentStyle={styles.content}
        footer={
          <View style={styles.actionsRow}>
            <Button title="View" variant="outline" size="sm" onPress={handleView} style={styles.actionButton} />
            {showBidActions ? (
              <Button title="Bid" size="sm" onPress={handleBid} style={styles.actionButton} />
            ) : null}
          </View>
        }
      >
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{formatCategoryLabel(task.category)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.metaInline}>
              <Badge label={formatTaskStatusLabel(task.status)} variant={getStatusVariant(task.status)} />
              <Text style={styles.dateText}>{formatDate(task.createdAt)}</Text>
            </View>
          </View>
          <Text style={styles.budget}>{formatCurrency(displayBudget)}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.detailsGrid}>
          <Text style={styles.metaText}>Location: {task.location}</Text>
          <Text style={styles.metaText}>Budget: {formatCurrency(task.budget)}</Text>
          <Text style={styles.metaText}>Client: {task.clientName || "Anonymous"}</Text>
          {task.deadline ? <Text style={styles.metaText}>Due {formatDate(task.deadline)}</Text> : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderColor: colors.dark[100],
  },
  content: {
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    gap: 6,
  },
  categoryPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.dark[50],
  },
  categoryPillText: {
    color: colors.dark[700],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  title: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  budget: {
    color: colors.success[700],
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  metaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dateText: {
    color: colors.dark[500],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  description: {
    color: colors.dark[600],
    fontSize: 15,
    lineHeight: 22,
  },
  detailsGrid: {
    gap: 6,
  },
  metaText: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
