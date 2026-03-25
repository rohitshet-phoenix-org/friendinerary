import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, StatusBar
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { COLORS } from "../../theme/colors";
import type { AuthScreenProps } from "../../navigation/types";

const LoginScreen = observer(({ navigation }: AuthScreenProps<"Login">) => {
  const { auth } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await auth.login({ email, password });
    } catch (err: any) {
      Alert.alert("Login failed", err.response?.data?.message ?? "Invalid email or password");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>✈️</Text>
        </View>
        <Text style={styles.appName}>Friendinerary</Text>
        <Text style={styles.tagline}>Plan trips with friends</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="••••••••"
          containerStyle={{ marginTop: 12 }}
        />

        <Button
          onPress={handleLogin}
          loading={auth.loading}
          fullWidth
          style={{ marginTop: 20 }}
          size="lg"
        >
          Sign in
        </Button>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button variant="secondary" onPress={() => {}} fullWidth>
          Continue with Google
        </Button>

        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <Text style={styles.signupTextBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.brand50,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: "700", color: COLORS.gray900, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
  form: { gap: 0 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerText: { fontSize: 13, color: COLORS.gray400 },
  signupLink: { alignItems: "center", marginTop: 20 },
  signupText: { fontSize: 14, color: COLORS.gray500 },
  signupTextBold: { fontWeight: "600", color: COLORS.brand600 },
});

export default LoginScreen;
