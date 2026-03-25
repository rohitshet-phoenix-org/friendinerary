import React, { useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, StatusBar
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import type { TripSummary } from "@friendinerary/types";
import { COLORS } from "../../theme/colors";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { TripScreenProps } from "../../navigation/types";
import { format } from "date-fns";

const DashboardScreen = observer(({ navigation }: TripScreenProps<"Dashboard">) => {
  const { trips, auth } = useStore();

  useEffect(() => {
    trips.fetchTrips();
  }, []);

  const handleRefresh = useCallback(() => {
    trips.fetchTrips();
  }, []);

  const handleDelete = (trip: TripSummary) => {
    Alert.alert(
      "Delete trip",
      `Are you sure you want to delete "${trip.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => trips.deleteTrip(trip.id),
        },
      ]
    );
  };

  if (trips.loading && trips.trips.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with create button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good trip, {auth.user?.displayName?.split(" ")[0]}!</Text>
          <Text style={styles.subtitle}>{trips.trips.length} trip{trips.trips.length !== 1 ? "s" : ""}</Text>
        </View>
        <Button onPress={() => navigation.navigate("CreateTrip")} size="sm">
          + New trip
        </Button>
      </View>

      {trips.trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>Create your first trip to get started</Text>
          <Button onPress={() => navigation.navigate("CreateTrip")} style={{ marginTop: 20 }}>
            Plan a trip
          </Button>
        </View>
      ) : (
        <FlatList
          data={trips.trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={trips.loading}
              onRefresh={handleRefresh}
              tintColor={COLORS.brand500}
            />
          }
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate("TripDetail", { tripId: item.id, tripName: item.name })}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}
    </View>
  );
});

function TripCard({
  trip, onPress, onDelete
}: {
  trip: TripSummary;
  onPress: () => void;
  onDelete: () => void;
}) {
  const placeCount = trip.placeCount ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.tripCard} padding={0}>
        {/* Cover */}
        <View style={styles.tripCover}>
          <Text style={styles.tripCoverEmoji}>🗺️</Text>
        </View>

        {/* Info */}
        <View style={styles.tripInfo}>
          <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
          {trip.destinations && trip.destinations.length > 0 && (
            <Text style={styles.tripDest} numberOfLines={1}>
              📍 {trip.destinations.join(", ")}
            </Text>
          )}
          <View style={styles.tripMeta}>
            {trip.startDate && (
              <Text style={styles.tripMetaText}>
                {format(new Date(trip.startDate), "MMM d")}
                {trip.endDate && ` – ${format(new Date(trip.endDate), "MMM d")}`}
              </Text>
            )}
            <Text style={styles.tripMetaText}>{placeCount} places</Text>
            <Text style={styles.tripMetaText}>
              {trip.collaboratorCount ?? 1} traveler{(trip.collaboratorCount ?? 1) !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: COLORS.gray900 },
  subtitle: { fontSize: 13, color: COLORS.gray400, marginTop: 2 },
  listContent: { padding: 16, gap: 12 },
  tripCard: { overflow: "hidden" },
  tripCover: {
    height: 100,
    backgroundColor: COLORS.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  tripCoverEmoji: { fontSize: 40 },
  tripInfo: { padding: 14 },
  tripName: { fontSize: 16, fontWeight: "700", color: COLORS.gray900 },
  tripDest: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  tripMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  tripMetaText: { fontSize: 12, color: COLORS.gray400 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.gray700, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray400, marginTop: 8, textAlign: "center" },
});

export default DashboardScreen;
