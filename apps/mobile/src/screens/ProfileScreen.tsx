import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import { COLORS } from "../theme/colors";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import Toast from "react-native-toast-message";

const ProfileScreen = observer(() => {
  const { auth } = useStore();
  const [displayName, setDisplayName] = useState(auth.user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await auth.updateProfile({ displayName });
      setEditing(false);
      Toast.show({ type: "success", text1: "Profile updated" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => auth.logout() },
    ]);
  };

  const user = auth.user;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          {user?.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.displayName?.[0]?.toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {auth.isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>⭐ Friendinerary Pro</Text>
          </View>
        )}
      </View>

      {/* Profile section */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editLink}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor={COLORS.gray400}
            />
            <Button onPress={handleSave} loading={saving} size="sm" style={{ marginTop: 10 }}>
              Save changes
            </Button>
          </>
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Name</Text>
              <Text style={styles.profileValue}>{user?.displayName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{user?.email}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Subscription */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subRow}>
          <View>
            <Text style={styles.subPlan}>{auth.isPro ? "Friendinerary Pro" : "Free plan"}</Text>
            <Text style={styles.subDesc}>
              {auth.isPro
                ? "Full access to all features"
                : "Upgrade to unlock route optimization, AI assistant, and more"}
            </Text>
          </View>
          {!auth.isPro && (
            <Button size="sm">Upgrade</Button>
          )}
        </View>
      </Card>

      {/* Sign out */}
      <Button variant="danger" onPress={handleLogout} fullWidth style={{ marginTop: 8 }}>
        Sign out
      </Button>

      <Text style={styles.version}>Friendinerary v1.0.0</Text>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brand500,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: COLORS.white },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.gray900, marginTop: 12 },
  email: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
  proBadge: {
    backgroundColor: COLORS.brand50,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.brand100,
  },
  proBadgeText: { fontSize: 12, fontWeight: "600", color: COLORS.brand700 },
  section: { marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.gray900 },
  editLink: { fontSize: 14, color: COLORS.brand500, fontWeight: "600" },
  profileInfo: { gap: 10 },
  profileRow: { flexDirection: "row", justifyContent: "space-between" },
  profileLabel: { fontSize: 13, color: COLORS.gray400 },
  profileValue: { fontSize: 13, fontWeight: "600", color: COLORS.gray700 },
  nameInput: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.gray900,
  },
  subRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  subPlan: { fontSize: 14, fontWeight: "700", color: COLORS.gray900 },
  subDesc: { fontSize: 12, color: COLORS.gray400, marginTop: 2, flex: 1, lineHeight: 16 },
  version: { textAlign: "center", fontSize: 12, color: COLORS.gray300, marginTop: 16 },
});

export default ProfileScreen;
