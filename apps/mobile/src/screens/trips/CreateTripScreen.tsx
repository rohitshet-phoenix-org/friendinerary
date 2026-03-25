import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Alert
} from "react-native";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { COLORS } from "../../theme/colors";
import type { TripScreenProps } from "../../navigation/types";

const CreateTripScreen = observer(({ navigation }: TripScreenProps<"CreateTrip">) => {
  const { trips } = useStore();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a trip name");
      return;
    }
    setLoading(true);
    try {
      const trip = await trips.createTrip({
        name,
        destinations: destination ? [destination] : [],
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        generateDaySections: !!(startDate && endDate),
      });
      navigation.replace("TripDetail", { tripId: trip.id, tripName: trip.name });
    } catch {
      Alert.alert("Error", "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Plan a new trip</Text>
      <Text style={styles.subtitle}>Start building your itinerary</Text>

      <View style={styles.form}>
        <Input
          label="Trip name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Tokyo Summer 2025"
          autoFocus
        />
        <Input
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Tokyo, Japan"
          containerStyle={{ marginTop: 12 }}
        />
        <Input
          label="Start date"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          containerStyle={{ marginTop: 12 }}
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="End date"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          containerStyle={{ marginTop: 12 }}
          keyboardType="numbers-and-punctuation"
        />

        {startDate && endDate && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              ✨ We'll automatically create day-by-day sections for your trip
            </Text>
          </View>
        )}

        <Button
          onPress={handleCreate}
          loading={loading}
          fullWidth
          style={{ marginTop: 24 }}
          size="lg"
        >
          Create trip
        </Button>
        <Button
          variant="ghost"
          onPress={() => navigation.goBack()}
          fullWidth
          style={{ marginTop: 8 }}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.gray900 },
  subtitle: { fontSize: 14, color: COLORS.gray400, marginTop: 4, marginBottom: 28 },
  form: {},
  hint: {
    backgroundColor: COLORS.brand50,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  hintText: { fontSize: 13, color: COLORS.brand700 },
});

export default CreateTripScreen;
