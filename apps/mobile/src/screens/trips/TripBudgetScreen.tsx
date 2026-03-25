import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from "react-native";
import { api } from "../../lib/api";
import type { Expense, Budget } from "@friendinerary/types";
import { COLORS } from "../../theme/colors";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { TripScreenProps } from "../../navigation/types";
import Toast from "react-native-toast-message";

const CATEGORIES = [
  "food", "transport", "accommodation", "activities", "shopping", "other"
];

const TripBudgetScreen = ({ route }: TripScreenProps<"TripBudget">) => {
  const { tripId } = route.params;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expRes, budRes] = await Promise.all([
        api.get<{ data: Expense[] }>(`/trips/${tripId}/expenses`),
        api.get<{ data: Budget }>(`/trips/${tripId}/budget`).catch(() => ({ data: { data: null } })),
      ]);
      setExpenses(expRes.data.data);
      setBudget((budRes as any).data.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = budget ? budget.totalBudget - totalSpent : null;

  const handleAdd = async () => {
    if (!newTitle || !newAmount) return;
    setAdding(true);
    try {
      const { data } = await api.post<{ data: Expense }>(`/trips/${tripId}/expenses`, {
        title: newTitle,
        amount: parseFloat(newAmount),
        currency: budget?.currency ?? "USD",
        category: newCategory,
      });
      setExpenses((prev) => [data.data, ...prev]);
      setNewTitle("");
      setNewAmount("");
      setNewCategory("other");
      setShowAdd(false);
      Toast.show({ type: "success", text1: "Expense added" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to add expense" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (expenseId: string) => {
    Alert.alert("Delete expense", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
          setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total budget</Text>
            <Text style={styles.summaryValue}>
              {budget ? `$${budget.totalBudget.toLocaleString()}` : "—"}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, { color: COLORS.brand600 }]}>
              ${totalSpent.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Left</Text>
            <Text style={[styles.summaryValue, { color: remaining != null && remaining < 0 ? COLORS.error : COLORS.success }]}>
              {remaining != null ? `$${remaining.toLocaleString()}` : "—"}
            </Text>
          </View>
        </View>
        {budget && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((totalSpent / budget.totalBudget) * 100, 100)}%`,
                  backgroundColor: totalSpent > budget.totalBudget ? COLORS.error : COLORS.brand500,
                },
              ]}
            />
          </View>
        )}
      </Card>

      {/* Add expense button */}
      <Button
        onPress={() => setShowAdd(!showAdd)}
        variant="secondary"
        fullWidth
        style={{ marginBottom: 12 }}
      >
        + Add expense
      </Button>

      {/* Add form */}
      {showAdd && (
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.addTitle}>New expense</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What did you spend on?"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor={COLORS.gray400}
          />
          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            placeholder="Amount (USD)"
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="numeric"
            placeholderTextColor={COLORS.gray400}
          />
          {/* Category picker */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, newCategory === cat && styles.catBtnActive]}
                onPress={() => setNewCategory(cat)}
              >
                <Text style={[styles.catBtnText, newCategory === cat && styles.catBtnTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addFormButtons}>
            <Button onPress={handleAdd} loading={adding} size="sm">Save</Button>
            <Button variant="ghost" onPress={() => setShowAdd(false)} size="sm">Cancel</Button>
          </View>
        </Card>
      )}

      {/* Expense list */}
      <Text style={styles.sectionTitle}>Expenses ({expenses.length})</Text>
      {expenses.map((exp) => (
        <TouchableOpacity
          key={exp.id}
          onLongPress={() => handleDelete(exp.id)}
          activeOpacity={0.8}
        >
          <View style={styles.expenseRow}>
            <View style={styles.expenseIcon}>
              <Text style={styles.expenseIconText}>💰</Text>
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle}>{exp.title}</Text>
              <Text style={styles.expenseCat}>{exp.category}</Text>
            </View>
            <Text style={styles.expenseAmount}>
              ${exp.amount.toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      {expenses.length === 0 && (
        <Text style={styles.emptyText}>No expenses yet. Long-press to delete.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, color: COLORS.gray400, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: "700", color: COLORS.gray900, marginTop: 2 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  addTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  catBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  catBtnActive: { backgroundColor: COLORS.brand500 },
  catBtnText: { fontSize: 12, color: COLORS.gray600, textTransform: "capitalize" },
  catBtnTextActive: { color: COLORS.white, fontWeight: "600" },
  addFormButtons: { flexDirection: "row", gap: 8, marginTop: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseIconText: { fontSize: 18 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 14, fontWeight: "600", color: COLORS.gray900 },
  expenseCat: { fontSize: 12, color: COLORS.gray400, marginTop: 1, textTransform: "capitalize" },
  expenseAmount: { fontSize: 15, fontWeight: "700", color: COLORS.gray900 },
  emptyText: { fontSize: 13, color: COLORS.gray400, textAlign: "center", paddingVertical: 20 },
});

export default TripBudgetScreen;
