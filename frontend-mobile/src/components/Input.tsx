import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { colors, radius } from "@/theme/tokens";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  helperText,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  placeholderTextColor = colors.dark[400],
  ...props
}: InputProps): React.ReactElement {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        {...props}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={placeholderTextColor}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    fontWeight: "600",
    color: colors.dark[700],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.dark[200],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    color: colors.dark[900],
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.danger[500],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger[600],
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: colors.dark[500],
  },
});
