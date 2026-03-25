import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { COLORS } from "../../theme/colors";
import type { AuthScreenProps } from "../../navigation/types";

const SignupScreen = observer(({ navigation }: AuthScreenProps<"Signup">) => {
  const { auth } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    try {
      await auth.signup({ displayName: name, email, password });
    } catch (err: any) {
      Alert.alert("Signup failed", err.response?.data?.message ?? "Could not create account");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join Friendinerary and start planning</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Smith"
          autoComplete="name"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          containerStyle={{ marginTop: 12 }}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          containerStyle={{ marginTop: 12 }}
        />

        <Button onPress={handleSignup} loading={auth.loading} fullWidth style={{ marginTop: 20 }} size="lg">
          Create account
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.gray900, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.gray500, marginTop: 6 },
  form: {},
  loginLink: { alignItems: "center", marginTop: 20 },
  loginText: { fontSize: 14, color: COLORS.gray500 },
  loginBold: { fontWeight: "600", color: COLORS.brand600 },
});

export default SignupScreen;
