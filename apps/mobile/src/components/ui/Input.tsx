import React from "react";
import {
  TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle
} from "react-native";
import { COLORS } from "../../theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, containerStyle, leftIcon, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithIcon, style]}
          placeholderTextColor={COLORS.gray400}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.gray600 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.gray900,
  },
  inputWithIcon: { paddingLeft: 6 },
  inputError: { borderColor: COLORS.error },
  iconLeft: { paddingLeft: 12 },
  errorText: { fontSize: 12, color: COLORS.error },
});
