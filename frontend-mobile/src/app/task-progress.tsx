import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { colors, radius } from "@/theme/tokens";
import { uploadImageToCloudinary } from "@/utils/cloudinaryUpload";
import { api } from "@/services/api";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTaskStatusLabel,
  getDisplayName,
  isProvider,
  isRequester,
} from "@/utils/taskUtils";

export default function TaskProgressPage(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    requesterTasks,
    assignedTasks,
    currentTask,
    taskProgressUpdates,
    taskSubtasks,
    taskProgressSummary,
    taskDisputes,
    taskActivityLogs,
    fetchRequesterTasks,
    fetchAssignedTasks,
    fetchTaskProgress,
    addTaskProgressUpdate,
    updateTaskSubtaskStatus,
    confirmTaskCompletion,
    openTaskDispute,
    isLoading,
  } = useTaskStore((state) => ({
    requesterTasks: state.requesterTasks,
    assignedTasks: state.assignedTasks,
    currentTask: state.currentTask,
    taskProgressUpdates: state.taskProgressUpdates,
    taskSubtasks: state.taskSubtasks,
    taskProgressSummary: state.taskProgressSummary,
    taskDisputes: state.taskDisputes,
    taskActivityLogs: state.taskActivityLogs,
    fetchRequesterTasks: state.fetchRequesterTasks,
    fetchAssignedTasks: state.fetchAssignedTasks,
    fetchTaskProgress: state.fetchTaskProgress,
    addTaskProgressUpdate: state.addTaskProgressUpdate,
    updateTaskSubtaskStatus: state.updateTaskSubtaskStatus,
    confirmTaskCompletion: state.confirmTaskCompletion,
    openTaskDispute: state.openTaskDispute,
    isLoading: state.isLoading,
  }));

  const [progressPercent, setProgressPercent] = useState("");
  const [note, setNote] = useState("");
  const [milestoneStatus, setMilestoneStatus] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [proofImages, setProofImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [disputeReason, setDisputeReason] = useState("QUALITY_ISSUE");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeImages, setDisputeImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | number | null>(null);

  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [targetAddress, setTargetAddress] = useState("");
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const verifyLocation = async () => {
    if (!selectedTaskId || !currentTask || !user) return;
    setIsVerifyingLocation(true);
    setLocationError("");
    try {
      if (!targetAddress.trim()) {
        throw new Error("Please enter the exact number and street address.");
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error("Permission to access location was denied");
      }

      const fullAddressToSearch = currentTask.location 
        ? `${targetAddress}, ${currentTask.location}` 
        : targetAddress;
      const geocoded = await Location.geocodeAsync(fullAddressToSearch);
      if (geocoded.length === 0) {
        throw new Error(`Could not find coordinates for address: ${targetAddress}`);
      }
      const targetCoords = geocoded[0];

      const providerAddressInfo = await Location.reverseGeocodeAsync(targetCoords);

      if (providerAddressInfo.length > 0) {
        const normalize = (s: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/gi, ' ').toLowerCase().trim() : "";
        const skipWords = new Set(['duong', 'pho', 'hem', 'ngo', 'quan', 'district', 'thanh', 'city', 'str', 'street', 'so', 'ward', 'phuong']);
        
        const inWords = normalize(targetAddress).split(/\s+/).filter(w => w.length > 1 && !skipWords.has(w));
        
        const outStr1 = normalize(providerAddressInfo[0]?.street || "");
        const outStr2 = normalize(providerAddressInfo[0]?.name || "");
        const outWords = [...outStr1.split(/\s+/), ...outStr2.split(/\s+/)].filter(w => w.length > 1 && !skipWords.has(w));
        
        if (outWords.length > 0 && inWords.length > 0) {
          let hasMatch = false;
          for (const w of inWords) {
            if (outWords.includes(w)) {
              hasMatch = true;
              break;
            }
          }
          if (!hasMatch) {
            throw new Error("The entered address could not be matched to an actual valid street. Please check for typos and try again.");
          }
        }
      }

      if (currentTask.location) {
        const taskGeocoded = await Location.geocodeAsync(currentTask.location);
        if (taskGeocoded.length > 0) {
          const taskCoords = taskGeocoded[0];
          const taskAddressInfo = await Location.reverseGeocodeAsync(taskCoords);

          const provDist = providerAddressInfo[0]?.district || providerAddressInfo[0]?.city || providerAddressInfo[0]?.subregion || "";
          const taskDist = taskAddressInfo[0]?.district || taskAddressInfo[0]?.city || taskAddressInfo[0]?.subregion || "";

          if (provDist && taskDist && provDist.toLowerCase() !== taskDist.toLowerCase()) {
            throw new Error("The entered address must be in the same district as the task location.");
          }
        }
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      const distance = getDistanceFromLatLonInKm(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        targetCoords.latitude,
        targetCoords.longitude
      );

      if (distance > 1.0) {
        throw new Error(`You are too far away (${distance.toFixed(2)} km). You must be within 1km near the entered address.`);
      }

      await api.tasks.verifyOnSite(selectedTaskId);
      await fetchTaskProgress(selectedTaskId);
      setIsLocationVerified(true);

      try {
        await api.tracking.update({
          taskId: Number(selectedTaskId),
          providerId: Number(user.id),
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.log("Failed to log tracking, but verified locally", err);
      }
    } catch (err: any) {
      setLocationError(err.message || "Failed to verify location.");
      Alert.alert("Verification Failed", err.message || "Failed to verify location.");
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isRequester(user)) {
      void fetchRequesterTasks();
    }
    if (isProvider(user)) {
      void fetchAssignedTasks();
    }
  }, [fetchAssignedTasks, fetchRequesterTasks, isAuthenticated, user]);

  useEffect(() => {
    if (!params.taskId) return;
    void fetchTaskProgress(params.taskId);
  }, [fetchTaskProgress, params.taskId]);

  useEffect(() => {
    if (!taskProgressSummary) return;
    setProgressPercent(String(taskProgressSummary.progressPercent || 0));
    setMilestoneStatus(taskProgressSummary.milestoneStatus || "");
    setEstimatedCompletionDate(taskProgressSummary.estimatedCompletionDate || "");
  }, [taskProgressSummary]);

  const trackableTasks = useMemo(
    () => (isProvider(user) ? assignedTasks : requesterTasks),
    [assignedTasks, requesterTasks, user]
  );

  const selectedTaskId = typeof params.taskId === "string" ? params.taskId : undefined;
  const isRequesterView = isRequester(user);
  const isProviderView = isProvider(user);
  const isOwner = currentTask ? String(currentTask.createdById) === String(user?.id) : false;
  const isAssignedProvider = currentTask ? String(currentTask.assignedProviderId) === String(user?.id) : false;
  const canManageProgress =
    isProviderView &&
    isAssignedProvider &&
    currentTask != null &&
    ["ASSIGNED", "IN_PROGRESS", "PENDING_CONFIRMATION"].includes(String(currentTask.status));
  const canConfirm =
    isRequesterView &&
    isOwner &&
    currentTask != null &&
    String(currentTask.status) === "PENDING_CONFIRMATION";
  const canOpenDispute =
    currentTask != null &&
    (isOwner || isAssignedProvider) &&
    !["PAID", "CANCELLED"].includes(String(currentTask.status));
  const summaryProgress = Math.max(0, Math.min(100, taskProgressSummary?.progressPercent ?? 0));
  const totalSubtasks = taskSubtasks.length;
  const doneSubtasks = taskSubtasks.filter((item) => item.status === "DONE").length;

  const onSiteVerifiedAt = currentTask?.onSiteVerifiedAt ? new Date(currentTask.onSiteVerifiedAt).getTime() : 0;
  const hoursSinceVerify = onSiteVerifiedAt ? (Date.now() - onSiteVerifiedAt) / (1000 * 60 * 60) : 0;
  const isTimeValid = hoursSinceVerify >= 0 && hoursSinceVerify <= 8;

  const pickImage = async (target: "proof" | "dispute"): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    if (target === "proof") {
      setProofImages((current) => [...current, result.assets[0]].slice(0, 3));
      return;
    }
    setDisputeImages((current) => [...current, result.assets[0]].slice(0, 3));
  };

  const publishProgressUpdate = async (): Promise<void> => {
    if (!selectedTaskId || !currentTask) return;
    if (!note.trim()) {
      Alert.alert("Work summary required", "Add a note before publishing progress.");
      return;
    }

    const parsedProgress = Number(progressPercent);
    if (!Number.isFinite(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
      Alert.alert("Invalid progress", "Progress percent must be between 0 and 100.");
      return;
    }

    try {
      const attachmentUrls = await Promise.all(
        proofImages.map((asset) =>
          uploadImageToCloudinary({
            uri: asset.uri,
            fileName: asset.fileName || `proof-${Date.now()}.jpg`,
            mimeType: asset.mimeType,
          })
        )
      );

      await addTaskProgressUpdate(selectedTaskId, {
        progressPercent: parsedProgress,
        note: note.trim(),
        attachments: attachmentUrls,
        milestoneStatus: milestoneStatus.trim() || undefined,
        estimatedCompletionDate: estimatedCompletionDate.trim() || undefined,
        markAsCompleted,
      });

      setNote("");
      setProofImages([]);
      setMarkAsCompleted(false);
      Alert.alert("Progress updated", "The task timeline has been refreshed from the shared backend.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to update progress.";
      Alert.alert("Update failed", message);
    }
  };

  const handleConfirmCompletion = async (): Promise<void> => {
    if (!selectedTaskId) return;

    try {
      await confirmTaskCompletion(selectedTaskId);
      Alert.alert("Completion confirmed", "The task has been marked completed.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to confirm completion.";
      Alert.alert("Confirmation failed", message);
    }
  };

  const handleUpdateSubtask = async (
    subtaskId: string | number,
    status: "PENDING" | "IN_PROGRESS" | "DONE"
  ): Promise<void> => {
    if (!selectedTaskId || !canManageProgress) return;
    setUpdatingSubtaskId(subtaskId);
    try {
      await updateTaskSubtaskStatus(selectedTaskId, subtaskId, status);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to update checklist item.";
      Alert.alert("Checklist update failed", message);
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const handleOpenDispute = async (): Promise<void> => {
    if (!selectedTaskId || !disputeDescription.trim()) {
      Alert.alert("Dispute details required", "Describe the issue before opening a dispute.");
      return;
    }

    try {
      const evidenceUrls = await Promise.all(
        disputeImages.map((asset) =>
          uploadImageToCloudinary({
            uri: asset.uri,
            fileName: asset.fileName || `dispute-${Date.now()}.jpg`,
            mimeType: asset.mimeType,
          })
        )
      );

      await openTaskDispute(selectedTaskId, {
        reason: disputeReason as any,
        description: disputeDescription.trim(),
        evidenceUrls,
      });
      setDisputeDescription("");
      setDisputeImages([]);
      Alert.alert("Dispute opened", "The dispute was sent to the shared task workflow.");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to open dispute.";
      Alert.alert("Dispute failed", message);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <MarketplaceShell activeRoute="progress">
        <Card>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Sign in to manage task progress</Text>
            <Text style={styles.promptBody}>
              Task progress is role-aware and stays synced with the same backend flow used on web.
            </Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="progress">
      <View style={styles.headerCopy}>
        <Text style={styles.pageTitle}>Task Progress</Text>
        <Text style={styles.pageSubtitle}>Show and update the progress of your tasks</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Select a task</Text>
        <View style={styles.selectorList}>
          {trackableTasks.length === 0 ? (
            <Text style={styles.emptyText}>No trackable tasks yet.</Text>
          ) : (
            trackableTasks.map((task) => (
              <Pressable
                key={String(task.id)}
                onPress={() =>
                  router.replace({ pathname: "/task-progress", params: { taskId: String(task.id) } })
                }
                style={[
                  styles.selectorItem,
                  String(task.id) === String(selectedTaskId) ? styles.selectorItemActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.selectorTitle,
                    String(task.id) === String(selectedTaskId) ? styles.selectorTitleActive : null,
                  ]}
                >
                  {task.title}
                </Text>
                <Text style={styles.selectorMeta}>
                  {formatTaskStatusLabel(task.status)} · {formatCurrency(Number(task.budget || 0))}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </Card>

      {selectedTaskId && currentTask ? (
        <>
          <Card>
            <View style={styles.summaryTop}>
              <View style={styles.summaryCopy}>
                <Text style={styles.currentTaskTitle}>{currentTask.title}</Text>
                <Text style={styles.currentTaskBody}>{currentTask.description}</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{formatTaskStatusLabel(currentTask.status)}</Text>
              </View>
            </View>

            <View style={styles.summaryMetrics}>
              <SummaryMetric label="Progress" value={`${summaryProgress}%`} />
              <SummaryMetric
                label="Latest Milestone"
                value={taskProgressSummary?.milestoneStatus || "No milestone yet"}
              />
              <SummaryMetric
                label="Estimated Completion"
                value={taskProgressSummary?.estimatedCompletionDate ? formatDate(taskProgressSummary.estimatedCompletionDate) : "Not set"}
              />
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${summaryProgress}%` }]} />
            </View>
          </Card>

          <Card title="Progress Timeline">
            {taskProgressUpdates.length === 0 ? (
              <Text style={styles.emptyText}>No progress updates yet.</Text>
            ) : (
              <View style={styles.timelineList}>
                {taskProgressUpdates.map((update) => (
                  <View key={String(update.id)} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineTitle}>{update.progressPercent}% complete</Text>
                      <Text style={styles.timelineMeta}>
                        {update.milestoneStatus || "General update"} · {formatDateTime(update.createdAt)}
                      </Text>
                      <Text style={styles.timelineNote}>{update.note}</Text>
                      {update.attachments?.length ? (
                        <Text style={styles.timelineAttachment}>{update.attachments.length} proof image(s) attached</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card title="Subtask Checklist">
            {taskSubtasks.length === 0 ? (
              <Text style={styles.emptyText}>No subtasks/checkpoints available for this task yet.</Text>
            ) : (
              <View style={styles.subtaskList}>
                <Text style={styles.subtaskSummary}>
                  Completed: {doneSubtasks}/{totalSubtasks}
                </Text>
                {taskSubtasks.map((subtask) => (
                  <View key={String(subtask.id)} style={styles.subtaskItem}>
                    <View style={styles.subtaskCopy}>
                      <Text style={styles.subtaskTitle}>{subtask.title}</Text>
                      <Text style={styles.subtaskMeta}>
                        {subtask.progressPercent ? `${subtask.progressPercent}%` : "Checkpoint"} · {subtask.status}
                      </Text>
                    </View>
                    {canManageProgress && currentTask?.isOnSite ? (
                      <View style={styles.subtaskActions}>
                        <Button
                          title="Start"
                          size="sm"
                          variant="outline"
                          disabled={!isTimeValid}
                          onPress={() => void handleUpdateSubtask(subtask.id, "IN_PROGRESS")}
                          loading={updatingSubtaskId === subtask.id}
                        />
                        <Button
                          title="Done"
                          size="sm"
                          disabled={!isTimeValid}
                          onPress={() => void handleUpdateSubtask(subtask.id, "DONE")}
                          loading={updatingSubtaskId === subtask.id}
                        />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card title="Task Team">
            <View style={styles.teamList}>
              <Text style={styles.teamItem}>Requester: {getDisplayName(currentTask.createdBy || currentTask.client)}</Text>
              <Text style={styles.teamItem}>
                Assigned Provider: {getDisplayName(currentTask.assignedProvider || currentTask.provider)}
              </Text>
            </View>
          </Card>

          {taskActivityLogs.length > 0 ? (
            <Card title="Activity">
              <View style={styles.activityList}>
                {taskActivityLogs.slice(0, 4).map((item) => (
                  <View key={String(item.id)} style={styles.activityItem}>
                    <Text style={styles.activityMessage}>{item.message}</Text>
                    <Text style={styles.activityMeta}>{formatDateTime(item.createdAt)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {canManageProgress ? (
            <Card title="Location Verification">
              <View style={styles.form}>
                <Text style={styles.promptBody}>
                  You must verify your location before you can start subtasks or update progress. Please confirm the task address.
                </Text>
                <Input
                  label="District / City"
                  value={currentTask.location || "Not specified"}
                  editable={false}
                  inputStyle={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                />
                <Input
                  label="House Number & Street"
                  value={targetAddress}
                  onChangeText={setTargetAddress}
                  placeholder="e.g. 123 Main St"
                />
                {locationError ? <Text style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{locationError}</Text> : null}
                <Button
                  title={isVerifyingLocation ? "Verifying..." : "Verify GPS Location"}
                  onPress={() => void verifyLocation()}
                  loading={isVerifyingLocation}
                />
              </View>
            </Card>
          ) : null}

          {canManageProgress && currentTask?.isOnSite ? (
            <Card title="Provider Update Panel">
              <View style={styles.form}>
                <Input
                  label="Progress (%)"
                  keyboardType="numeric"
                  value={progressPercent}
                  onChangeText={setProgressPercent}
                />
                <Input
                  label="Work Summary Note"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={4}
                />
                <Input label="Milestone Status" value={milestoneStatus} onChangeText={setMilestoneStatus} />
                <Input
                  label="Estimated Completion Date"
                  value={estimatedCompletionDate}
                  onChangeText={setEstimatedCompletionDate}
                  helperText="Use an ISO date/time string to mirror web data formatting."
                />

                <View style={styles.imageUploadBox}>
                  <Text style={styles.sectionSubTitle}>Proof Images</Text>
                  <Button title="Choose Image" size="sm" onPress={() => void pickImage("proof")} />
                  {proofImages.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.uploadRow}>
                      <Image source={{ uri: asset.uri }} style={styles.uploadThumb} />
                      <Text style={styles.uploadText} numberOfLines={1}>
                        {asset.fileName || `proof-${index + 1}.jpg`}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable style={styles.checkboxRow} onPress={() => setMarkAsCompleted((current) => !current)}>
                  <View style={[styles.checkbox, markAsCompleted ? styles.checkboxChecked : null]} />
                  <Text style={styles.checkboxText}>
                    Mark task as completed when publishing this update
                  </Text>
                </Pressable>

                {!isTimeValid && (
                  <Text style={{ color: 'red', fontSize: 13, marginTop: 4, marginBottom: 8 }}>
                    Progress can only be updated within 8 hours after verifying GPS location.
                  </Text>
                )}

                <Button
                  title={isLoading ? "Publishing..." : "Publish Progress Update"}
                  disabled={!isTimeValid}
                  onPress={() => void publishProgressUpdate()}
                />
              </View>
            </Card>
          ) : null}

          {canConfirm ? (
            <Card title="Requester Confirmation">
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>
                  Provider marked this task as completed. Confirm when work quality is accepted.
                </Text>
                <Button title="Confirm Completion" onPress={() => void handleConfirmCompletion()} />
              </View>
            </Card>
          ) : null}

          {canOpenDispute ? (
            <Card title="Open Dispute">
              <View style={styles.form}>
                <Input
                  label="Reason"
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  helperText="Examples: QUALITY_ISSUE, PROVIDER_NOT_DELIVERING, PAYMENT_ISSUE"
                />
                <Input
                  label="Description"
                  value={disputeDescription}
                  onChangeText={setDisputeDescription}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.imageUploadBox}>
                  <Text style={styles.sectionSubTitle}>Evidence Images</Text>
                  <Button title="Choose Image" size="sm" variant="outline" onPress={() => void pickImage("dispute")} />
                  {disputeImages.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.uploadRow}>
                      <Image source={{ uri: asset.uri }} style={styles.uploadThumb} />
                      <Text style={styles.uploadText} numberOfLines={1}>
                        {asset.fileName || `evidence-${index + 1}.jpg`}
                      </Text>
                    </View>
                  ))}
                </View>
                <Button title="Open Dispute" variant="outline" onPress={() => void handleOpenDispute()} />
              </View>
            </Card>
          ) : null}

          {taskDisputes.length > 0 ? (
            <Card title="Disputes">
              <View style={styles.disputeList}>
                {taskDisputes.map((dispute) => (
                  <View key={String(dispute.id)} style={styles.disputeItem}>
                    <Text style={styles.disputeReason}>{dispute.reason.replaceAll("_", " ")}</Text>
                    <Text style={styles.disputeStatus}>{dispute.status}</Text>
                    {dispute.description ? <Text style={styles.disputeBody}>{dispute.description}</Text> : null}
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      ) : selectedTaskId ? (
        <Card>
          <Text style={styles.emptyText}>Loading task progress...</Text>
        </Card>
      ) : null}
    </MarketplaceShell>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCopy: {
    gap: 2,
  },
  pageTitle: {
    color: colors.dark[900],
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.dark[900],
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  sectionSubTitle: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  selectorList: {
    gap: 8,
  },
  selectorItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    padding: 12,
    gap: 2,
  },
  selectorItemActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  selectorTitle: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  selectorTitleActive: {
    color: colors.primary[700],
  },
  selectorMeta: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
  summaryTop: {
    gap: 12,
  },
  summaryCopy: {
    gap: 6,
  },
  currentTaskTitle: {
    color: colors.dark[900],
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  currentTaskBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
  },
  summaryBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryBadgeText: {
    color: colors.primary[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  summaryMetrics: {
    gap: 10,
    marginTop: 12,
  },
  metricCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 2,
  },
  metricLabel: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.dark[900],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.dark[200],
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[600],
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
    marginTop: 6,
  },
  timelineBody: {
    flex: 1,
    gap: 3,
  },
  timelineTitle: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  timelineMeta: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
  },
  timelineNote: {
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
  },
  timelineAttachment: {
    color: colors.primary[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  teamList: {
    gap: 8,
  },
  teamItem: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
    gap: 3,
  },
  activityMessage: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  activityMeta: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
  },
  subtaskList: {
    gap: 10,
  },
  subtaskSummary: {
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  subtaskItem: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 10,
    gap: 10,
  },
  subtaskCopy: {
    gap: 2,
  },
  subtaskTitle: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  subtaskMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  subtaskActions: {
    flexDirection: "row",
    gap: 8,
  },
  form: {
    gap: 12,
  },
  imageUploadBox: {
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
  },
  uploadText: {
    flex: 1,
    color: colors.dark[700],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark[300],
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxText: {
    flex: 1,
    color: colors.dark[700],
    fontSize: 13,
    lineHeight: 18,
  },
  confirmBox: {
    gap: 10,
  },
  confirmText: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 20,
  },
  disputeList: {
    gap: 8,
  },
  disputeItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger[200],
    backgroundColor: colors.danger[50],
    padding: 12,
    gap: 3,
  },
  disputeReason: {
    color: colors.danger[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  disputeStatus: {
    color: colors.danger[700],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  disputeBody: {
    color: colors.danger[700],
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: colors.dark[500],
    fontSize: 14,
    lineHeight: 20,
  },
  promptBox: {
    alignItems: "center",
    gap: 8,
  },
  promptTitle: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  promptBody: {
    color: colors.dark[600],
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
