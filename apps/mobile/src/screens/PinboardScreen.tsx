import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator
} from "react-native";
import { api } from "../lib/api";
import { COLORS } from "../theme/colors";

interface PinboardEntry {
  id: string;
  countryCode: string;
  cityName: string;
  visitedAt?: string;
  tripId?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "🇯🇵", US: "🇺🇸", FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸",
  GB: "🇬🇧", DE: "🇩🇪", AU: "🇦🇺", TH: "🇹🇭", SG: "🇸🇬",
};

const PinboardScreen = () => {
  const [pins, setPins] = useState<PinboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: PinboardEntry[] }>("/pinboard")
      .then(({ data }) => setPins(data.data))
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>World Pinboard</Text>
        <Text style={styles.subtitle}>{pins.length} places visited</Text>
      </View>

      {pins.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌍</Text>
          <Text style={styles.emptyTitle}>Your world map is empty</Text>
          <Text style={styles.emptySubtitle}>
            Places from your trips will automatically appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={pins}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.pinRow}>
              <Text style={styles.pinFlag}>
                {COUNTRY_FLAGS[item.countryCode] ?? "📍"}
              </Text>
              <View style={styles.pinInfo}>
                <Text style={styles.pinCity}>{item.cityName}</Text>
                <Text style={styles.pinCountry}>{item.countryCode}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.gray900 },
  subtitle: { fontSize: 13, color: COLORS.gray400, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.gray700, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray400, marginTop: 8, textAlign: "center" },
  listContent: { padding: 16, gap: 8 },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  pinFlag: { fontSize: 32 },
  pinInfo: {},
  pinCity: { fontSize: 15, fontWeight: "600", color: COLORS.gray900 },
  pinCountry: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
});

export default PinboardScreen;
