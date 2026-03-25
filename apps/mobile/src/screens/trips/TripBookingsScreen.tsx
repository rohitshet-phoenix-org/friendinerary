import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { api } from "../../lib/api";
import type { Reservation } from "@friendinerary/types";
import { COLORS } from "../../theme/colors";
import type { TripScreenProps } from "../../navigation/types";
import { format } from "date-fns";

const ICONS: Record<string, string> = {
  flight: "✈️",
  hotel: "🏨",
  car_rental: "🚗",
  activity: "🎫",
};

const TripBookingsScreen = ({ route }: TripScreenProps<"TripBookings">) => {
  const { tripId } = route.params;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Reservation[] }>(`/trips/${tripId}/reservations`)
      .then(({ data }) => setReservations(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  return (
    <FlatList
      data={reservations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      style={styles.container}
      ListEmptyComponent={() => (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎫</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySubtitle}>
            Forward confirmation emails to your trip's inbound address
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.icon}>{ICONS[item.type] ?? "📋"}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.confirmationCode && (
              <Text style={styles.cardCode}>{item.confirmationCode}</Text>
            )}
            {item.startDate && (
              <Text style={styles.cardDate}>
                {format(new Date(item.startDate), "MMM d, yyyy")}
              </Text>
            )}
            <Text style={styles.cardProvider}>{item.provider}</Text>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray700, marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: COLORS.gray400, marginTop: 8, textAlign: "center", paddingHorizontal: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardLeft: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.brand50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray900 },
  cardCode: { fontSize: 12, fontFamily: "monospace", color: COLORS.gray500, marginTop: 2 },
  cardDate: { fontSize: 12, color: COLORS.brand600, marginTop: 2 },
  cardProvider: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
});

export default TripBookingsScreen;
