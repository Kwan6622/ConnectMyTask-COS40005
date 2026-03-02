import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme/tokens";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "primary" }: BadgeProps): React.ReactElement {
  return (
    <View style={[styles.base, variantStyles[variant]]}>
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary[50], borderColor: colors.primary[200] },
  success: { backgroundColor: colors.success[50], borderColor: colors.success[200] },
  warning: { backgroundColor: colors.warning[50], borderColor: colors.warning[200] },
  danger: { backgroundColor: colors.danger[50], borderColor: colors.danger[200] },
  neutral: { backgroundColor: colors.dark[50], borderColor: colors.dark[200] },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.primary[700] },
  success: { color: colors.success[700] },
  warning: { color: colors.warning[600] },
  danger: { color: colors.danger[700] },
  neutral: { color: colors.dark[700] },
});
