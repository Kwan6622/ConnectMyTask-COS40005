import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, shadow } from "@/theme/tokens";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  title,
  actions,
  footer,
  style,
  contentStyle,
}: CardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      {(title || actions) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {actions}
        </View>
      )}

      <View style={[styles.content, contentStyle]}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dark[100],
    overflow: "hidden",
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[100],
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.dark[900],
  },
  content: {
    padding: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.dark[100],
    backgroundColor: colors.dark[50],
  },
});
