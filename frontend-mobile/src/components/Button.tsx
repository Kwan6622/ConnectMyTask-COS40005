import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radius, shadow } from "@/theme/tokens";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  style,
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, sizeTextStyles[size], { color: textColors[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.6,
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  default: {
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 54,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
};

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13, lineHeight: 18 },
  default: { fontSize: 15, lineHeight: 20 },
  lg: { fontSize: 17, lineHeight: 22 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
    ...shadow.soft,
  },
  secondary: {
    backgroundColor: colors.accent[600],
    borderColor: colors.accent[600],
    ...shadow.soft,
  },
  success: {
    backgroundColor: colors.success[600],
    borderColor: colors.success[600],
    ...shadow.soft,
  },
  danger: {
    backgroundColor: colors.danger[600],
    borderColor: colors.danger[600],
    ...shadow.soft,
  },
  outline: {
    backgroundColor: colors.white,
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: colors.dark[100],
    borderColor: colors.dark[100],
  },
};

const textColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.white,
  success: colors.white,
  danger: colors.white,
  outline: colors.primary[700],
  ghost: colors.dark[700],
};
