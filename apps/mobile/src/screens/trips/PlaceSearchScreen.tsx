import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { observer } from "mobx-react-lite";
import { api } from "../../lib/api";
import { COLORS } from "../../theme/colors";
import type { TripScreenProps } from "../../navigation/types";
import type { PlaceSearchResult } from "@friendinerary/types";
import Toast from "react-native-toast-message";

const PlaceSearchScreen = observer(({ navigation, route }: TripScreenProps<"PlaceSearch">) => {
  const { tripId, sectionId } = route.params;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<{ data: PlaceSearchResult[] }>(
        `/trips/${tripId}/places/search`,
        { params: { query: text } }
      );
      setResults(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const handleAddPlace = async (place: PlaceSearchResult) => {
    setAdding(place.googlePlaceId);
    try {
      await api.post(`/trips/${tripId}/sections/${sectionId}/places`, {
        googlePlaceId: place.googlePlaceId,
        name: place.name,
        address: place.address,
      });
      Toast.show({ type: "success", text1: "Place added!" });
      navigation.goBack();
    } catch {
      Toast.show({ type: "error", text1: "Failed to add place" });
    } finally {
      setAdding(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place..."
          placeholderTextColor={COLORS.gray400}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={COLORS.brand500} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.googlePlaceId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultRow}
            onPress={() => handleAddPlace(item)}
            disabled={adding === item.googlePlaceId}
            activeOpacity={0.7}
          >
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>📍</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
              {item.address && (
                <Text style={styles.resultAddress} numberOfLines={1}>{item.address}</Text>
              )}
              {item.category && (
                <Text style={styles.resultCategory}>{item.category}</Text>
              )}
            </View>
            {adding === item.googlePlaceId ? (
              <ActivityIndicator size="small" color={COLORS.brand500} />
            ) : (
              <Text style={styles.addIcon}>+</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          query.length > 1 && !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No places found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray900,
  },
  listContent: { padding: 16, gap: 8 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconText: { fontSize: 20 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "600", color: COLORS.gray900 },
  resultAddress: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  resultCategory: {
    fontSize: 11,
    color: COLORS.brand600,
    marginTop: 2,
    textTransform: "capitalize",
  },
  addIcon: { fontSize: 20, color: COLORS.brand500, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
});

export default PlaceSearchScreen;
