import React, { useEffect } from "react";
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator, Alert
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { COLORS } from "../../theme/colors";
import { Card } from "../../components/ui/Card";
import type { TripScreenProps } from "../../navigation/types";
import type { Section, PlaceItem } from "@friendinerary/types";
import { api } from "../../lib/api";
import Toast from "react-native-toast-message";

const TripItineraryScreen = observer(({ navigation, route }: TripScreenProps<"TripItinerary">) => {
  const { trips } = useStore();
  const { tripId } = route.params;

  useEffect(() => {
    if (!trips.currentTrip || trips.currentTrip.id !== tripId) {
      trips.loadTrip(tripId);
    }
  }, [tripId]);

  const trip = trips.currentTrip;

  if (!trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  const handleDeletePlace = async (sectionId: string, itemId: string) => {
    Alert.alert("Remove place", "Remove this place from your itinerary?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/trips/${tripId}/sections/${sectionId}/places/${itemId}`);
            trips.loadTrip(tripId); // refresh
            Toast.show({ type: "success", text1: "Place removed" });
          } catch {
            Toast.show({ type: "error", text1: "Failed to remove place" });
          }
        },
      },
    ]);
  };

  const sections = trip.sections.map((sec) => ({
    key: sec.id,
    section: sec,
    data: sec.placeItems,
  }));

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { section } }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={styles.sectionName}>{section.name}</Text>
            <Text style={styles.sectionCount}>
              {section.placeItems.length} place{section.placeItems.length !== 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("PlaceSearch", { tripId, sectionId: section.id })}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        )}
        renderSectionFooter={({ section: { data } }) =>
          data.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No places yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item, section: { section } }) => (
          <PlaceItemRow
            item={item}
            onLongPress={() => handleDeletePlace(section.id, item.id)}
          />
        )}
        ListFooterComponent={() => (
          <TouchableOpacity
            style={styles.addSectionBtn}
            onPress={async () => {
              // Could show an input sheet
              Toast.show({ type: "info", text1: "Long press a section to add places" });
            }}
          >
            <Text style={styles.addSectionBtnText}>+ Add section</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
});

function PlaceItemRow({ item, onLongPress }: { item: PlaceItem; onLongPress: () => void }) {
  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.9}>
      <View style={styles.placeRow}>
        <View style={styles.placeThumb}>
          <Text style={styles.placeThumbText}>📍</Text>
        </View>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>{item.place.name}</Text>
          {item.place.address && (
            <Text style={styles.placeAddress} numberOfLines={1}>{item.place.address}</Text>
          )}
          {item.startTime && (
            <Text style={styles.placeTime}>🕐 {item.startTime}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionName: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.gray900 },
  sectionCount: { fontSize: 12, color: COLORS.gray400 },
  addBtn: {
    backgroundColor: COLORS.brand50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.brand600 },
  emptySection: { paddingLeft: 18, paddingBottom: 8 },
  emptySectionText: { fontSize: 13, color: COLORS.gray400, fontStyle: "italic" },
  placeRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: "center",
  },
  placeThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  placeThumbText: { fontSize: 20 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: "600", color: COLORS.gray900 },
  placeAddress: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  placeTime: { fontSize: 12, color: COLORS.brand600, marginTop: 2 },
  addSectionBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.gray200,
    borderRadius: 12,
  },
  addSectionBtnText: { fontSize: 14, color: COLORS.gray400 },
});

export default TripItineraryScreen;
