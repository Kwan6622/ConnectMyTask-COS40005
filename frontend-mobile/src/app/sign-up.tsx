import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/authStore";
import { colors, radius } from "@/theme/tokens";
import { AccountType } from "@/types";

type FieldErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword", string>>;

const accountTypeOptions: Array<{ label: string; value: AccountType }> = [
  { label: "Client", value: "client" },
  { label: "Service Provider", value: "service_provider" },
];

function validateSignUp({
  fullName,
  email,
  password,
  confirmPassword,
}: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!normalizedEmail) {
    errors.email = "Email address is required.";
  } else if (!emailRegex.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function SignUpScreen(): React.ReactElement {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("client");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSignUp = async (): Promise<void> => {
    const validationErrors = validateSignUp({
      fullName,
      email,
      password,
      confirmPassword,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        accountType,
        password,
      });

      router.replace("/");
    } catch (error) {
      console.error("Sign up failed", error);
      setFormError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safeArea}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />
            <Badge label="Create account" variant="primary" />
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>Join as a client or service provider and sync with web instantly.</Text>
          </View>

          <Card>
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={fullName}
                onChangeText={setFullName}
                error={errors.fullName}
              />

              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Phone Number (optional)"
                placeholder="e.g. +84 912 345 678"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <View style={styles.radioSection}>
                <Text style={styles.radioLabel}>Account Type</Text>
                <View style={styles.radioGroup}>
                  {accountTypeOptions.map((option) => {
                    const selected = accountType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setAccountType(option.value)}
                        style={[styles.radioOption, selected ? styles.radioOptionSelected : null]}
                      >
                        <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text style={[styles.radioText, selected ? styles.radioTextSelected : null]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Button title="Create Account" onPress={handleSignUp} loading={loading} size="lg" />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Pressable onPress={() => router.push("/sign-in")}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  radioSection: {
    gap: 8,
  },
  radioLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.dark[700],
    fontWeight: "600",
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.dark[400],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary[600],
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
  },
  radioText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.dark[700],
    fontWeight: "600",
  },
  radioTextSelected: {
    color: colors.primary[700],
  },
  formError: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger[600],
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.dark[600],
  },
  footerLink: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary[700],
    fontWeight: "700",
  },
});
