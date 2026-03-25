import React from "react";
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle
} from "react-native";
import { COLORS } from "../../theme/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function Button({
  children, onPress, variant = "primary", loading, disabled, fullWidth, size = "md", style
}: ButtonProps) {
  const btnStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    styles[`size_${size}Text` as keyof typeof styles] as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={btnStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? COLORS.white : COLORS.brand500}
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primary: { backgroundColor: COLORS.brand500 },
  secondary: { backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200 },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: COLORS.error },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.5 },

  size_sm: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  size_md: { paddingHorizontal: 18, paddingVertical: 11 },
  size_lg: { paddingHorizontal: 24, paddingVertical: 14 },

  text: { fontWeight: "600" },
  primaryText: { color: COLORS.white },
  secondaryText: { color: COLORS.gray700 },
  ghostText: { color: COLORS.brand500 },
  dangerText: { color: COLORS.white },

  size_smText: { fontSize: 13 },
  size_mdText: { fontSize: 15 },
  size_lgText: { fontSize: 16 },
});
