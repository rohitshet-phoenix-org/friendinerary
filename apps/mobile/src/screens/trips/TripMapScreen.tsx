import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { COLORS } from "../../theme/colors";
import type { TripScreenProps } from "../../navigation/types";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from "react-native-maps";
import type { PlaceItem } from "@friendinerary/types";

const TripMapScreen = observer(({ navigation, route }: TripScreenProps<"TripMap">) => {
  const { trips } = useStore();
  const { tripId } = route.params;
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!trips.currentTrip || trips.currentTrip.id !== tripId) {
      trips.loadTrip(tripId);
    }
  }, [tripId]);

  const trip = trips.currentTrip;
  if (!trip) return null;

  // Gather all place items with coordinates
  const markers: { item: PlaceItem; sectionColor: string; sectionName: string }[] = [];
  for (const section of trip.sections) {
    for (const item of section.placeItems) {
      if (item.place.coordinates?.lat && item.place.coordinates?.lng) {
        markers.push({ item, sectionColor: section.color, sectionName: section.name });
      }
    }
  }

  // Calculate initial region
  let initialRegion: Region = {
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  if (markers.length > 0) {
    const lats = markers.map((m) => m.item.place.coordinates!.lat);
    const lngs = markers.map((m) => m.item.place.coordinates!.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    initialRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
    };
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map(({ item, sectionColor }) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.place.coordinates!.lat,
              longitude: item.place.coordinates!.lng,
            }}
            pinColor={sectionColor}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{item.place.name}</Text>
                {item.place.address && (
                  <Text style={styles.calloutAddress}>{item.place.address}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Places count pill */}
      <View style={styles.countPill}>
        <Text style={styles.countPillText}>{markers.length} places</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  callout: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    maxWidth: 200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutName: { fontSize: 13, fontWeight: "700", color: COLORS.gray900 },
  calloutAddress: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  closeBtn: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeBtnText: { fontSize: 16, color: COLORS.gray600 },
  countPill: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: COLORS.gray900,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countPillText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
});

export default TripMapScreen;
