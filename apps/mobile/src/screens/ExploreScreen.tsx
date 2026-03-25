import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, ActivityIndicator
} from "react-native";
import { api } from "../lib/api";
import type { GuideSummary } from "@friendinerary/types";
import { COLORS } from "../theme/colors";

const CATEGORIES = ["All", "Restaurants", "Attractions", "Hotels", "Activities", "Shopping", "Outdoors"];

const ExploreScreen = () => {
  const [guides, setGuides] = useState<GuideSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: GuideSummary[] }>("/guides", {
        params: { destination: destination || undefined, category: category || undefined },
      });
      setGuides(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search destination..."
          placeholderTextColor={COLORS.gray400}
          value={destination}
          onChangeText={(t) => {
            setDestination(t);
            // Debounce via effect? For simplicity, direct fetch on submit
          }}
          onSubmitEditing={fetchGuides}
          returnKeyType="search"
        />
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catsContent}
        style={styles.catsList}
        renderItem={({ item }) => {
          const active = (item === "All" && !category) || category === item.toLowerCase();
          return (
            <TouchableOpacity
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => {
                setCategory(item === "All" ? "" : item.toLowerCase());
                fetchGuides();
              }}
            >
              <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Guides grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand500} />
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.guidesContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No guides found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.guideCard}>
              <View style={styles.guideCover}>
                {item.coverPhotoUrl ? (
                  <Image source={{ uri: item.coverPhotoUrl }} style={StyleSheet.absoluteFillObject} />
                ) : (
                  <Text style={styles.guideEmoji}>🗺️</Text>
                )}
              </View>
              <View style={styles.guideInfo}>
                <Text style={styles.guideTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.guideAuthor} numberOfLines={1}>{item.authorName}</Text>
                <Text style={styles.guidePlaces}>{item.placeCount} places</Text>
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
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.gray900 },
  searchInput: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.gray50,
  },
  catsList: { maxHeight: 50, backgroundColor: COLORS.white },
  catsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  catPillActive: { backgroundColor: COLORS.brand500 },
  catPillText: { fontSize: 13, fontWeight: "500", color: COLORS.gray600 },
  catPillTextActive: { color: COLORS.white, fontWeight: "600" },
  guidesContent: { padding: 12, gap: 12 },
  columnWrapper: { gap: 12 },
  guideCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  guideCover: {
    height: 100,
    backgroundColor: COLORS.brand50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  guideEmoji: { fontSize: 36 },
  guideInfo: { padding: 10 },
  guideTitle: { fontSize: 13, fontWeight: "700", color: COLORS.gray900, lineHeight: 18 },
  guideAuthor: { fontSize: 11, color: COLORS.gray400, marginTop: 3 },
  guidePlaces: { fontSize: 11, color: COLORS.brand500, marginTop: 3 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: COLORS.gray400, fontSize: 14 },
});

export default ExploreScreen;
