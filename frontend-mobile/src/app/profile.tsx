import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/taskStore";
import { ProviderCertificate, ProviderProfile, UserRatingSummary } from "@/types";
import { colors, radius } from "@/theme/tokens";
import { uploadImageToCloudinary } from "@/utils/cloudinaryUpload";
import { getDisplayName, getSuccessTone, isProvider, isRequester } from "@/utils/taskUtils";

const emptyProviderProfile: ProviderProfile = {
  specialties: [],
  safetyComplianceAgreed: false,
};

export default function ProfilePage(): React.ReactElement {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, updateProfilePhoto, isLoading } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    logout: state.logout,
    updateProfile: state.updateProfile,
    updateProfilePhoto: state.updateProfilePhoto,
    isLoading: state.isLoading,
  }));
  const { requesterTasks, assignedTasks, fetchRequesterTasks, fetchAssignedTasks } = useTaskStore((state) => ({
    requesterTasks: state.requesterTasks,
    assignedTasks: state.assignedTasks,
    fetchRequesterTasks: state.fetchRequesterTasks,
    fetchAssignedTasks: state.fetchAssignedTasks,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedAssetName, setSelectedAssetName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [providerProfile, setProviderProfile] = useState<ProviderProfile>(emptyProviderProfile);
  const [providerCertificates, setProviderCertificates] = useState<ProviderCertificate[]>([]);
  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary | null>(null);
  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [certificateFileUrl, setCertificateFileUrl] = useState("");
  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isRequester(user)) void fetchRequesterTasks();
    if (isProvider(user)) void fetchAssignedTasks();
  }, [fetchAssignedTasks, fetchRequesterTasks, isAuthenticated, user]);

  useEffect(() => {
    setFullName(user?.fullName || user?.name || "");
    setEmail(user?.email || "");
    setPhoneNumber(user?.phoneNumber || user?.phone || "");
    setLocation(user?.location || "");
    setBio(user?.bio || "");
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const resolvedUserId = userId;
    let mounted = true;

    async function loadProfileData() {
      try {
        const response = await api.users.getProfile(resolvedUserId);
        const payload = response.data || {};
        const profile = payload.providerProfile || emptyProviderProfile;

        if (!mounted) return;
        setProviderProfile({
          ...emptyProviderProfile,
          ...profile,
          specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
          safetyComplianceAgreed: Boolean(profile.safetyComplianceAgreed),
        });
        setProviderCertificates(Array.isArray(profile.certificates) ? profile.certificates : []);

        if (payload.providerRatingSummary) {
          setRatingSummary({
            averageRating: Number(payload.providerRatingSummary.averageRating || 0),
            totalReviews: Number(payload.providerRatingSummary.totalReviews || 0),
            latestComments: Array.isArray(payload.providerRatingSummary.latestComments)
              ? payload.providerRatingSummary.latestComments.slice(0, 5)
              : [],
          });
        } else {
          const ratingResponse = await api.ratings.getUserRatings(resolvedUserId);
          const data = ratingResponse.data || {};
          setRatingSummary({
            averageRating: Number(data.averageRating || 0),
            totalReviews: Number(data.totalReviews || 0),
            latestComments: Array.isArray(data.latestRatings) ? data.latestRatings.slice(0, 5) : [],
          });
        }
      } catch {
        if (!mounted) return;
        setProviderProfile(emptyProviderProfile);
        setProviderCertificates([]);
        setRatingSummary(null);
      }
    }

    void loadProfileData();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, userId]);

  const taskSet = isProvider(user) ? assignedTasks : requesterTasks;
  const completedTasks = useMemo(
    () => taskSet.filter((task) => ["COMPLETED", "PAID"].includes(String(task.status))).length,
    [taskSet]
  );
  const successRate = useMemo(() => {
    if (taskSet.length === 0) return 100;
    return Math.round((completedTasks / taskSet.length) * 100);
  }, [completedTasks, taskSet.length]);
  const reviewCount = ratingSummary?.totalReviews || Math.max(completedTasks, Math.round(Number(user?.rating || 0) * 2));
  const successTone = getSuccessTone(successRate);

  const chooseImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setSelectedAsset(asset);
    setSelectedAssetName(asset.fileName || asset.uri.split("/").pop() || "Selected image");
  };

  const handleUploadProfilePhoto = async (): Promise<void> => {
    if (!selectedAsset) {
      Alert.alert("Choose an image", "Select an image to preview it, then upload.");
      return;
    }

    try {
      const secureUrl = await uploadImageToCloudinary({
        uri: selectedAsset.uri,
        fileName: selectedAsset.fileName || `profile-${Date.now()}.jpg`,
        mimeType: selectedAsset.mimeType,
      });
      await updateProfilePhoto(secureUrl);
      Alert.alert("Profile updated", "Your profile photo was uploaded successfully.");
      setSelectedAsset(null);
      setSelectedAssetName("");
    } catch (error: any) {
      const message = error?.message || "Failed to upload profile photo.";
      Alert.alert("Upload failed", message);
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    await updateProfile({
      fullName: fullName.trim(),
      name: fullName.trim(),
      email: email.trim(),
      phone: phoneNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      location: location.trim(),
      bio: bio.trim(),
    });
    setIsEditing(false);
    Alert.alert("Profile saved", "Your profile information was updated.");
  };

  const handleSaveProviderTrust = async (): Promise<void> => {
    try {
      const response = await api.users.updateProviderProfile({
        address: providerProfile.address || "",
        district: providerProfile.district || "",
        city: providerProfile.city || "",
        specialties: providerProfile.specialties || [],
        safetyComplianceAgreed: Boolean(providerProfile.safetyComplianceAgreed),
        shortBio: providerProfile.shortBio || "",
      });
      const profile = response.data || {};
      setProviderProfile((prev) => ({
        ...prev,
        ...profile,
        specialties: Array.isArray(profile.specialties) ? profile.specialties : prev.specialties,
        safetyComplianceAgreed: Boolean(profile.safetyComplianceAgreed),
      }));
      setProviderCertificates(Array.isArray(profile.certificates) ? profile.certificates : providerCertificates);
      Alert.alert("Updated", "Provider trust profile has been saved.");
    } catch (error: any) {
      Alert.alert("Update failed", error?.response?.data?.message || "Cannot save provider profile.");
    }
  };

  const handleUploadCertificate = async (): Promise<void> => {
    if (!certificateTitle.trim() || !certificateType.trim() || !certificateFileUrl.trim()) {
      Alert.alert("Missing fields", "Enter title, certificate type, and file URL before upload.");
      return;
    }

    try {
      await api.users.uploadProviderCertificate({
        title: certificateTitle.trim(),
        certificateType: certificateType.trim(),
        fileUrl: certificateFileUrl.trim(),
      });
      const refreshed = await api.users.getProfile(user?.id || "");
      const profile = refreshed.data?.providerProfile || emptyProviderProfile;
      setProviderCertificates(Array.isArray(profile.certificates) ? profile.certificates : []);
      setCertificateTitle("");
      setCertificateType("");
      setCertificateFileUrl("");
      Alert.alert("Uploaded", "Certificate uploaded. Waiting admin verification.");
    } catch (error: any) {
      Alert.alert("Upload failed", error?.response?.data?.message || "Cannot upload certificate.");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <MarketplaceShell activeRoute="profile">
        <Card>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Sign in to view your profile</Text>
            <Text style={styles.promptBody}>
              Profile, saved tasks, and role-based workspace settings follow your shared account.
            </Text>
            <Button title="Sign In" onPress={() => router.push("/sign-in")} />
          </View>
        </Card>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell activeRoute="profile">
      <View style={styles.headerCopy}>
        <Text style={styles.pageTitle}>My Profile</Text>
        <Text style={styles.pageSubtitle}>Manage your account, trust data, and reviews</Text>
      </View>

      <Card>
        <View style={styles.profileCard}>
          {selectedAsset?.uri || user.profilePhotoUrl ? (
            <Image source={{ uri: selectedAsset?.uri || user.profilePhotoUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{getDisplayName(user).charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.photoControls}>
            <Button title="Choose Picture" size="sm" onPress={() => void chooseImage()} />
            <Text style={styles.selectedFileText}>{selectedAssetName || "No file chosen yet"}</Text>
            <Button
              title={isLoading ? "Uploading..." : "Upload Profile Photo"}
              size="sm"
              onPress={() => void handleUploadProfilePhoto()}
              disabled={!selectedAsset}
            />
          </View>

          <Badge label={isProvider(user) ? "Service Provider" : "Requester"} variant="primary" />

          <View style={styles.statsRow}>
            <StatBox label="Tasks Done" value={String(completedTasks)} accentColor={colors.primary[700]} />
            <StatBox label="Success" value={`${successRate}%`} accentColor={successToneColor(successTone)} />
            <StatBox
              label="Reviews"
              value={ratingSummary ? `${ratingSummary.averageRating.toFixed(1)} (${reviewCount})` : String(reviewCount)}
              accentColor={colors.accent[600]}
            />
          </View>
        </View>
      </Card>

      {ratingSummary && ratingSummary.totalReviews > 0 ? (
        <Card title="Ratings & Feedback">
          <Text style={styles.ratingHeadline}>⭐ {ratingSummary.averageRating.toFixed(1)} ({ratingSummary.totalReviews} reviews)</Text>
          <View style={styles.feedbackList}>
            {ratingSummary.latestComments.slice(0, 5).map((item) => (
              <View key={String(item.id)} style={styles.feedbackItem}>
                <Text style={styles.feedbackText}>{item.comment || "No comment"}</Text>
                <Text style={styles.feedbackMeta}>- {item.fromUser?.name || item.fromUser?.fullName || "User"}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {isProvider(user) ? (
        <Card title="Provider Trust Profile">
          <View style={styles.form}>
            <Input
              label="Specialties (comma separated)"
              placeholder="Cleaning, Delivery, Home Repair"
              value={(providerProfile.specialties || []).join(", ")}
              onChangeText={(value) =>
                setProviderProfile((prev) => ({
                  ...prev,
                  specialties: value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                }))
              }
            />
            <Input
              label="Address"
              value={providerProfile.address || ""}
              onChangeText={(value) => setProviderProfile((prev) => ({ ...prev, address: value }))}
            />
            <Input
              label="District"
              value={providerProfile.district || ""}
              onChangeText={(value) => setProviderProfile((prev) => ({ ...prev, district: value }))}
            />
            <Input
              label="City"
              value={providerProfile.city || ""}
              onChangeText={(value) => setProviderProfile((prev) => ({ ...prev, city: value }))}
            />
            <Input
              label="Short Bio"
              value={providerProfile.shortBio || ""}
              onChangeText={(value) => setProviderProfile((prev) => ({ ...prev, shortBio: value }))}
              multiline
              numberOfLines={3}
            />
            <Button
              title={providerProfile.safetyComplianceAgreed ? "Safety compliance agreed" : "Agree workplace safety"}
              variant={providerProfile.safetyComplianceAgreed ? "primary" : "outline"}
              onPress={() =>
                setProviderProfile((prev) => ({
                  ...prev,
                  safetyComplianceAgreed: !prev.safetyComplianceAgreed,
                }))
              }
            />
            <Button title="Save Trust Profile" onPress={() => void handleSaveProviderTrust()} />
          </View>
        </Card>
      ) : null}

      {isProvider(user) ? (
        <Card title="Certificates / Documents">
          <View style={styles.form}>
            <Input label="Certificate title" value={certificateTitle} onChangeText={setCertificateTitle} />
            <Input label="Certificate type" value={certificateType} onChangeText={setCertificateType} />
            <Input label="File URL" value={certificateFileUrl} onChangeText={setCertificateFileUrl} />
            <Button title="Upload Certificate" onPress={() => void handleUploadCertificate()} />
          </View>
          <View style={styles.certList}>
            {providerCertificates.length === 0 ? (
              <Text style={styles.promptBody}>No certificates uploaded yet.</Text>
            ) : (
              providerCertificates.map((cert) => (
                <View key={String(cert.id)} style={styles.certItem}>
                  <Text style={styles.certTitle}>{cert.title}</Text>
                  <Text style={styles.certMeta}>{cert.certificateType}</Text>
                  <Badge label={cert.verificationStatus} variant={cert.verificationStatus === "VERIFIED" ? "success" : cert.verificationStatus === "REJECTED" ? "danger" : "warning"} />
                </View>
              ))
            )}
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.contactCard}>
          <Text style={styles.contactText}>{email}</Text>
          {String(user.role || "").toUpperCase() === "ADMIN" ? (
            <Button title="Open Admin Dashboard" variant="outline" onPress={() => router.push("/admin-dashboard")} />
          ) : null}
          <Button
            title="Logout"
            variant="danger"
            onPress={() => {
              logout();
              router.push("/browse-tasks");
            }}
          />
        </View>
      </Card>

      <Card
        title="Profile Information"
        actions={
          <Button
            title={isEditing ? "Cancel" : "Edit"}
            size="sm"
            variant={isEditing ? "outline" : "primary"}
            onPress={() => setIsEditing((current) => !current)}
          />
        }
      >
        {isEditing ? (
          <View style={styles.form}>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} />
            <Input label="Email" value={email} onChangeText={setEmail} />
            <Input label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} />
            <Input label="Location" value={location} onChangeText={setLocation} />
            <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
            <Button title="Save Changes" onPress={() => void handleSaveProfile()} />
          </View>
        ) : (
          <View style={styles.infoList}>
            <InfoRow label="Full Name" value={fullName || "-"} />
            <InfoRow label="Email" value={email || "-"} />
            <InfoRow label="Phone Number" value={phoneNumber || "-"} />
            <InfoRow label="Location" value={location || "-"} />
            <InfoRow label="Bio" value={bio || "No bio added yet."} multiline />
          </View>
        )}
      </Card>
    </MarketplaceShell>
  );
}

function StatBox({ label, value, accentColor }: { label: string; value: string; accentColor: string }): React.ReactElement {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline ? styles.infoValueMultiline : null]}>{value}</Text>
    </View>
  );
}

function successToneColor(tone: "success" | "warning" | "danger"): string {
  if (tone === "success") return colors.success[700];
  if (tone === "warning") return colors.warning[600];
  return colors.danger[700];
}

const styles = StyleSheet.create({
  headerCopy: { gap: 2 },
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
  profileCard: {
    gap: 14,
    alignItems: "center",
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: colors.white,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
  },
  photoControls: {
    width: "100%",
    gap: 8,
  },
  selectedFileText: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  ratingHeadline: {
    color: colors.dark[900],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  feedbackList: { gap: 8 },
  feedbackItem: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 10,
    gap: 3,
  },
  feedbackText: {
    color: colors.dark[800],
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackMeta: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
  },
  certList: {
    marginTop: 12,
    gap: 8,
  },
  certItem: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 10,
    gap: 4,
  },
  certTitle: {
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  certMeta: {
    color: colors.dark[600],
    fontSize: 12,
    lineHeight: 16,
  },
  contactCard: {
    gap: 8,
    alignItems: "center",
  },
  contactText: {
    color: colors.dark[700],
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 10,
  },
  infoList: {
    gap: 10,
  },
  infoRow: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.dark[50],
    padding: 10,
    gap: 3,
  },
  infoLabel: {
    color: colors.dark[500],
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.dark[800],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  infoValueMultiline: {
    minHeight: 44,
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
