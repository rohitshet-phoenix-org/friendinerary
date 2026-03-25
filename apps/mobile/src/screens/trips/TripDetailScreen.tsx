import React, { useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { COLORS } from "../../theme/colors";
import { Card } from "../../components/ui/Card";
import type { TripScreenProps } from "../../navigation/types";
import { format } from "date-fns";

const TripDetailScreen = observer(({ navigation, route }: TripScreenProps<"TripDetail">) => {
  const { trips } = useStore();
  const { tripId } = route.params;

  useEffect(() => {
    trips.loadTrip(tripId);
    return () => trips.clearCurrentTrip();
  }, [tripId]);

  const trip = trips.currentTrip;

  if (trips.loading || !trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  const totalPlaces = trip.sections.reduce((s, sec) => s + sec.placeItems.length, 0);
  const dayCount = trip.sections.filter((s) => s.type === "day").length;

  const tabs = [
    { label: "Itinerary", screen: "TripItinerary" as const, emoji: "📋" },
    { label: "Map", screen: "TripMap" as const, emoji: "🗺️" },
    { label: "Budget", screen: "TripBudget" as const, emoji: "💰" },
    { label: "Bookings", screen: "TripBookings" as const, emoji: "🎫" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>✈️</Text>
        <Text style={styles.heroName}>{trip.name}</Text>
        {trip.destinations.length > 0 && (
          <Text style={styles.heroDest}>📍 {trip.destinations.join(", ")}</Text>
        )}
        {trip.startDate && (
          <Text style={styles.heroDates}>
            {format(new Date(trip.startDate), "MMM d")}
            {trip.endDate && ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
          </Text>
        )}
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <StatBox label="Places" value={String(totalPlaces)} />
        <StatBox label="Days" value={String(dayCount)} />
        <StatBox label="Travelers" value={String(trip.collaborators?.length ?? 1)} />
      </View>

      {/* Navigation tiles */}
      <View style={styles.tilesGrid}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tile}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.screen as any, { tripId } as any)}
          >
            <Text style={styles.tileEmoji}>{tab.emoji}</Text>
            <Text style={styles.tileLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("AIAssistant", { tripId })}
        >
          <Text style={styles.actionEmoji}>🤖</Text>
          <Text style={styles.actionLabel}>AI Assistant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("InviteCollaborators", { tripId })}
        >
          <Text style={styles.actionEmoji}>👥</Text>
          <Text style={styles.actionLabel}>Invite Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Inbound email */}
      <Card style={{ marginTop: 16 }}>
        <Text style={styles.emailLabel}>Forward reservation emails to:</Text>
        <Text style={styles.emailAddress} numberOfLines={1}>
          {(trip as any).inboundEmail ?? "Loading..."}
        </Text>
        <Text style={styles.emailHint}>We'll auto-import your bookings</Text>
      </Card>
    </ScrollView>
  );
});

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingVertical: 24 },
  heroEmoji: { fontSize: 56 },
  heroName: { fontSize: 22, fontWeight: "700", color: COLORS.gray900, marginTop: 12, textAlign: "center" },
  heroDest: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  heroDates: { fontSize: 13, color: COLORS.brand600, marginTop: 4, fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.brand500 },
  statLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  tile: {
    width: "47%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tileEmoji: { fontSize: 28 },
  tileLabel: { fontSize: 14, fontWeight: "600", color: COLORS.gray700 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.brand50,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.brand100,
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: COLORS.brand700 },
  emailLabel: { fontSize: 12, fontWeight: "600", color: COLORS.gray600, marginBottom: 6 },
  emailAddress: {
    fontSize: 12,
    fontFamily: "monospace",
    color: COLORS.gray700,
    backgroundColor: COLORS.gray100,
    padding: 10,
    borderRadius: 8,
  },
  emailHint: { fontSize: 11, color: COLORS.gray400, marginTop: 6 },
});

export default TripDetailScreen;
