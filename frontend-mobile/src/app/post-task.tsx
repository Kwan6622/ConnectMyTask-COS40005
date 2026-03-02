import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { TASK_CATEGORIES } from "@/constants/tasks";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors, radius } from "@/theme/tokens";
import { TaskCategory } from "@/types";
import { formatCategoryLabel } from "@/utils/taskUtils";

type FieldErrors = Partial<Record<"title" | "description" | "location" | "budget", string>>;

function validateForm({
  title,
  description,
  location,
  budget,
}: {
  title: string;
  description: string;
  location: string;
  budget: string;
}): FieldErrors {
  const next: FieldErrors = {};
  if (!title.trim()) next.title = "Task title is required.";
  if (!description.trim()) next.description = "Description is required.";
  if (!location.trim()) next.location = "Location is required.";

  const budgetValue = Number(budget);
  if (!budget.trim()) {
    next.budget = "Budget is required.";
  } else if (Number.isNaN(budgetValue) || budgetValue <= 0) {
    next.budget = "Budget must be greater than 0.";
  }

  return next;
}

export default function PostTaskScreen(): React.ReactElement {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { createTask, fetchTasks, isLoading } = useTaskStore((state) => ({
    createTask: state.createTask,
    fetchTasks: state.fetchTasks,
    isLoading: state.isLoading,
  }));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("DELIVERY");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const categoryButtons = useMemo(
    () => TASK_CATEGORIES.map((value) => ({ value, label: formatCategoryLabel(value) })),
    []
  );

  const resetForm = (): void => {
    setTitle("");
    setDescription("");
    setCategory("DELIVERY");
    setLocation("");
    setBudget("");
    setImageUrlInput("");
    setImageUrls([]);
    setErrors({});
    setFormError("");
  };

  const handleAddImageUrl = (): void => {
    const value = imageUrlInput.trim();
    if (!value || imageUrls.length >= 3) return;
    setImageUrls((prev) => [...prev, value]);
    setImageUrlInput("");
  };

  const handlePostTask = async (): Promise<void> => {
    const validation = validateForm({ title, description, location, budget });
    setErrors(validation);
    setFormError("");
    if (Object.keys(validation).length > 0) return;

    const createdById = Number(user?.id);
    if (!Number.isFinite(createdById) || createdById <= 0) {
      setFormError("Bạn cần đăng nhập lại để đăng task.");
      return;
    }

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        location: location.trim(),
        createdById,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      await fetchTasks();
      Alert.alert("Success", "Task posted successfully.");
      resetForm();
      router.replace("/browse-tasks");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to post task.";
      setFormError(message);
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <Badge label="Create New Listing" variant="primary" />
          <Text style={styles.title}>Post Task</Text>
          <Text style={styles.subtitle}>Describe your task and publish directly to the same backend as web.</Text>
        </View>

        <Card>
          <View style={styles.form}>
            <Input
              label="Task Title*"
              placeholder="Example: Website setup"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            <Input
              label="Description*"
              placeholder="Describe requirements and expected output."
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={setDescription}
              error={errors.description}
            />

            <View style={styles.group}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryWrap}>
                {categoryButtons.map((option) => (
                  <Button
                    key={option.value}
                    title={option.label}
                    size="sm"
                    variant={category === option.value ? "primary" : "outline"}
                    onPress={() => setCategory(option.value)}
                    style={styles.categoryChip}
                  />
                ))}
              </View>
            </View>

            <Input
              label="Location*"
              placeholder="Example: District 1, Ho Chi Minh City"
              value={location}
              onChangeText={setLocation}
              error={errors.location}
            />

            <Input
              label="Budget (VND)*"
              placeholder="Example: 1200000"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              error={errors.budget}
            />

            <View style={styles.group}>
              <Text style={styles.fieldLabel}>Image URLs (max 3)</Text>
              <View style={styles.imageRow}>
                <Input
                  placeholder="Paste image URL"
                  value={imageUrlInput}
                  onChangeText={setImageUrlInput}
                  style={styles.imageInput}
                />
                <Button title="Add" size="sm" onPress={handleAddImageUrl} />
              </View>
              <Text style={styles.helperText}>{imageUrls.length}/3 images</Text>
              {imageUrls.map((url, index) => (
                <View key={`${url}-${index}`} style={styles.imageItemRow}>
                  <Text numberOfLines={1} style={styles.imageItemText}>{url}</Text>
                  <Button
                    title="Remove"
                    size="sm"
                    variant="ghost"
                    onPress={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                  />
                </View>
              ))}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.actionRow}>
              <Button title="Cancel" variant="outline" onPress={() => router.back()} style={styles.actionButton} />
              <Button title="Post Task" onPress={() => void handlePostTask()} loading={isLoading} style={styles.actionButton} />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark[50],
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    borderRadius: radius.xl,
    backgroundColor: "#10214e",
    padding: 18,
    gap: 8,
    overflow: "hidden",
  },
  heroGlowOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.3)",
    top: -70,
    right: -40,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.24)",
    bottom: -80,
    left: -50,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.dark[200],
  },
  form: {
    gap: 14,
  },
  group: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.dark[700],
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    marginBottom: 2,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageInput: {
    flex: 1,
  },
  helperText: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  imageItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  imageItemText: {
    flex: 1,
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  formError: {
    color: colors.danger[600],
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
});
