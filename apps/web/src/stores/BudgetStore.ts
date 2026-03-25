import { makeAutoObservable, runInAction } from "mobx";
import type { Expense, Budget } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class BudgetStore {
  expenses: Expense[] = [];
  budget: Budget | null = null;
  loading = false;

  constructor(private root: RootStore) {
    makeAutoObservable(this);
  }

  get totalSpent() {
    return this.expenses.reduce((sum, e) => sum + e.amountInHomeCurrency, 0);
  }

  get remaining() {
    if (!this.budget) return null;
    return this.budget.totalBudget - this.totalSpent;
  }

  get categoryTotals(): Record<string, number> {
    return this.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amountInHomeCurrency;
      return acc;
    }, {});
  }

  async loadExpenses(tripId: string) {
    this.loading = true;
    try {
      const [expRes, budgetRes] = await Promise.all([
        api.get<{ data: Expense[] }>(`/trips/${tripId}/expenses`),
        api.get<{ data: Budget }>(`/trips/${tripId}/budget`),
      ]);
      runInAction(() => {
        this.expenses = expRes.data.data;
        this.budget = budgetRes.data.data;
        this.loading = false;
      });
    } catch {
      runInAction(() => (this.loading = false));
    }
  }

  async addExpense(tripId: string, payload: Partial<Expense>) {
    const { data } = await api.post<{ data: Expense }>(`/trips/${tripId}/expenses`, payload);
    runInAction(() => {
      this.expenses.unshift(data.data);
    });
    return data.data;
  }

  async deleteExpense(tripId: string, expenseId: string) {
    await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    runInAction(() => {
      this.expenses = this.expenses.filter((e) => e.id !== expenseId);
    });
  }

  async updateBudget(tripId: string, payload: Partial<Budget>) {
    const { data } = await api.put<{ data: Budget }>(`/trips/${tripId}/budget`, payload);
    runInAction(() => {
      this.budget = data.data;
    });
  }
}
