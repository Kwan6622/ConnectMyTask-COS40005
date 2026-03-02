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

export default function SignInScreen(): React.ReactElement {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSignIn = async (): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setFormError("Email and password are required.");
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      await login(normalizedEmail, password);
      router.replace("/");
    } catch (error) {
      console.error("Sign in failed", error);
      setFormError("Sign in failed. Please try again.");
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
            <Badge label="Welcome back" variant="primary" />
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Access your task dashboard with the same web data.</Text>
          </View>

          <Card>
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Button title="Sign In" onPress={handleSignIn} loading={loading} size="lg" />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <Pressable onPress={() => router.push("/sign-up")}>
                  <Text style={styles.footerLink}>Sign Up</Text>
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
