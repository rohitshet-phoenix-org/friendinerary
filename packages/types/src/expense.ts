export type ExpenseCategory =
  | "flights"
  | "accommodation"
  | "food"
  | "activities"
  | "transport"
  | "shopping"
  | "other";

export interface ExpenseSplit {
  userId: string;
  displayName: string;
  share: number;
  settled: boolean;
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  amountInHomeCurrency: number;
  homeCurrency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  paidByUserId: string;
  paidByName: string;
  splitBetween: ExpenseSplit[];
  linkedPlaceId: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface Budget {
  tripId: string;
  totalBudget: number;
  currency: string;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
  totalSpent: number;
  updatedAt: string;
}

export interface BalanceEntry {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  currency: string;
}

export interface CreateExpensePayload {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  paidByUserId: string;
  splitBetween: { userId: string; share: number }[];
  linkedPlaceId?: string;
}
