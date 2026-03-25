import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Share, Alert, ActivityIndicator
} from "react-native";
import { api } from "../../lib/api";
import { COLORS } from "../../theme/colors";
import { Button } from "../../components/ui/Button";
import type { TripScreenProps } from "../../navigation/types";
import Toast from "react-native-toast-message";

const InviteCollaboratorsScreen = ({ route, navigation }: TripScreenProps<"InviteCollaborators">) => {
  const { tripId } = route.params;
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      await api.post(`/trips/${tripId}/collaborators`, { email, permission: "edit" });
      Toast.show({ type: "success", text1: `Invitation sent to ${email}` });
      setEmail("");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message ?? "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleShareLink = async () => {
    setGeneratingLink(true);
    try {
      const { data } = await api.post<{ data: { url: string } }>(
        `/trips/${tripId}/collaborators/share-link`,
        { permission: "view" }
      );
      await Share.share({
        message: `Join my trip on Friendinerary! ${data.data.url}`,
        title: "Join my trip",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to generate link" });
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Invite by email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite by email</Text>
          <Text style={styles.sectionSubtitle}>They'll get an email with a link to join your trip</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="friend@example.com"
              placeholderTextColor={COLORS.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Button
              onPress={handleInvite}
              loading={sending}
              disabled={!email.trim()}
              size="sm"
            >
              Invite
            </Button>
          </View>
        </View>

        {/* Share link */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share a link</Text>
          <Text style={styles.sectionSubtitle}>Anyone with the link can view your trip</Text>
          <Button
            onPress={handleShareLink}
            loading={generatingLink}
            variant="secondary"
            fullWidth
          >
            🔗 Generate & share link
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, gap: 28 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.gray900 },
  sectionSubtitle: { fontSize: 13, color: COLORS.gray500 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.gray900,
  },
});

export default InviteCollaboratorsScreen;
