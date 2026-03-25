import { Router } from "express";
import { prisma } from "@friendinerary/db";
import { requireAuth } from "../middleware/auth";
import { requireTripAccess } from "../middleware/tripAccess";
import { sendSuccess, sendError } from "../utils/response";
import axios from "axios";

const router = Router();

async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  try {
    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env["EXCHANGE_RATE_API_KEY"] ?? ""}/pair/${from}/${to}/${amount}`
    );
    return data.conversion_result ?? amount;
  } catch {
    return amount;
  }
}

// GET /api/trips/:tripId/expenses
router.get("/:tripId/expenses", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: {
        splits: { include: { user: { select: { id: true, displayName: true } } } },
        paidBy: { select: { id: true, displayName: true } },
      },
      orderBy: { date: "desc" },
    });
    return sendSuccess(res, expenses);
  } catch (err) {
    return next(err);
  }
});

// POST /api/trips/:tripId/expenses
router.post("/:tripId/expenses", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { amount, currency, category, description, date, paidByUserId, splitBetween, linkedPlaceId } = req.body as {
      amount: number;
      currency: string;
      category: string;
      description: string;
      date: string;
      paidByUserId: string;
      splitBetween: { userId: string; share: number }[];
      linkedPlaceId?: string;
    };

    // Get budget currency for conversion
    const budget = await prisma.budget.findUnique({ where: { tripId } });
    const homeCurrency = budget?.currency ?? "USD";
    const amountInHome = await convertCurrency(amount, currency, homeCurrency);

    const expense = await prisma.expense.create({
      data: {
        tripId,
        amount,
        currency,
        amountInHomeCurrency: amountInHome,
        homeCurrency,
        category: category as never,
        description,
        date: new Date(date),
        paidByUserId,
        linkedPlaceId: linkedPlaceId ?? null,
        splits: {
          create: (splitBetween ?? []).map((s) => ({
            userId: s.userId,
            share: s.share,
            settled: false,
          })),
        },
      },
      include: {
        splits: { include: { user: { select: { id: true, displayName: true } } } },
        paidBy: { select: { id: true, displayName: true } },
      },
    });

    return sendSuccess(res, expense, 201);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/expenses/:expenseId
router.put("/:tripId/expenses/:expenseId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, currency, category, date, settled } = req.body as {
      description?: string;
      amount?: number;
      currency?: string;
      category?: string;
      date?: string;
      settled?: boolean;
    };

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(description && { description }),
        ...(amount && { amount }),
        ...(currency && { currency }),
        ...(category && { category: category as never }),
        ...(date && { date: new Date(date) }),
      },
      include: { splits: true, paidBy: { select: { id: true, displayName: true } } },
    });

    if (settled !== undefined) {
      await prisma.expenseSplit.updateMany({
        where: { expenseId },
        data: { settled },
      });
    }

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/trips/:tripId/expenses/:expenseId
router.delete("/:tripId/expenses/:expenseId", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    await prisma.expense.delete({ where: { id: expenseId } });
    return sendSuccess(res, null, 200, "Expense deleted");
  } catch (err) {
    return next(err);
  }
});

// GET /api/trips/:tripId/expenses/summary
router.get("/:tripId/expenses/summary", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const [expenses, budget] = await Promise.all([
      prisma.expense.findMany({
        where: { tripId },
        include: { splits: true, paidBy: { select: { id: true, displayName: true } } },
      }),
      prisma.budget.findUnique({ where: { tripId } }),
    ]);

    // Category totals
    const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amountInHomeCurrency;
      return acc;
    }, {});

    // Balance computation
    const balances = new Map<string, number>(); // userId -> net balance
    for (const expense of expenses) {
      const payer = expense.paidByUserId;
      balances.set(payer, (balances.get(payer) ?? 0) + expense.amountInHomeCurrency);
      for (const split of expense.splits) {
        balances.set(split.userId, (balances.get(split.userId) ?? 0) - split.share);
      }
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amountInHomeCurrency, 0);

    return sendSuccess(res, {
      totalSpent,
      budget: budget?.totalBudget ?? null,
      remaining: budget ? budget.totalBudget - totalSpent : null,
      currency: budget?.currency ?? "USD",
      categoryTotals,
      balances: Object.fromEntries(balances),
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/trips/:tripId/budget
router.get("/:tripId/budget", requireAuth, requireTripAccess("view"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const budget = await prisma.budget.findUnique({ where: { tripId } });
    return sendSuccess(res, budget);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/trips/:tripId/budget
router.put("/:tripId/budget", requireAuth, requireTripAccess("edit"), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { totalBudget, currency, categoryBudgets } = req.body as {
      totalBudget: number;
      currency?: string;
      categoryBudgets?: Record<string, number>;
    };

    const budget = await prisma.budget.upsert({
      where: { tripId },
      update: {
        totalBudget,
        ...(currency && { currency }),
        ...(categoryBudgets && { categoryBudgetsJson: categoryBudgets }),
      },
      create: {
        tripId,
        totalBudget,
        currency: currency ?? "USD",
        categoryBudgetsJson: categoryBudgets ?? {},
      },
    });

    return sendSuccess(res, budget);
  } catch (err) {
    return next(err);
  }
});

export default router;
