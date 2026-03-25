import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "700", color: COLORS.gray900, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700", color: COLORS.gray900 },
  h3: { fontSize: 18, fontWeight: "600", color: COLORS.gray900 },
  h4: { fontSize: 16, fontWeight: "600", color: COLORS.gray900 },
  body: { fontSize: 15, fontWeight: "400", color: COLORS.gray700, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400", color: COLORS.gray500, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "400", color: COLORS.gray400 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.gray600 },
  button: { fontSize: 15, fontWeight: "600" },
});
