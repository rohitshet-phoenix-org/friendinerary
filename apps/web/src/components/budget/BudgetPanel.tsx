import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, DollarSign, TrendingUp, Target } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_COLORS: Record<string, string> = {
  flights: "#F97316", accommodation: "#8B5CF6", food: "#10B981",
  activities: "#3B82F6", transport: "#F59E0B", shopping: "#EC4899", other: "#9CA3AF",
};

const BudgetPanel = observer(({ tripId }: { tripId: string }) => {
  const { budget: store, ui, settings } = useStore();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", currency: settings.currency, category: "food", date: new Date().toISOString().slice(0, 10) });

  const chartData = Object.entries(store.categoryTotals).map(([name, value]) => ({ name, value }));

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await store.addExpense(tripId, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        paidByUserId: "self",
        splitBetween: [],
        date: newExpense.date,
      } as never);
      setNewExpense({ description: "", amount: "", currency: settings.currency, category: "food", date: new Date().toISOString().slice(0, 10) });
      setShowAddExpense(false);
      toast.success("Expense added");
    } catch {
      toast.error("Failed to add expense");
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Budget overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Target className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{store.budget ? settings.formatCurrency(store.budget.totalBudget) : "—"}</p>
          <p className="text-xs text-gray-400">Budget</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-500">{settings.formatCurrency(store.totalSpent)}</p>
          <p className="text-xs text-gray-400">Spent</p>
        </div>
        <div className="card p-4 text-center">
          <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className={`text-2xl font-bold ${store.remaining != null && store.remaining < 0 ? "text-red-500" : "text-green-500"}`}>
            {store.remaining != null ? settings.formatCurrency(store.remaining) : "—"}
          </p>
          <p className="text-xs text-gray-400">Remaining</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">Spending by category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={chartData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => settings.formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name] ?? "#9CA3AF" }} />
                  <span className="capitalize text-gray-600">{entry.name}</span>
                  <span className="ml-auto font-medium text-gray-900">{settings.formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add expense button */}
      <button onClick={() => setShowAddExpense(true)} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add expense
      </button>

      {/* Add expense form */}
      {showAddExpense && (
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">New expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <input type="text" className="input" placeholder="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="input" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required min="0" step="0.01" />
              <select className="input" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                {["flights", "accommodation", "food", "activities", "transport", "shopping", "other"].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <input type="date" className="input" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Add</button>
              <button type="button" onClick={() => setShowAddExpense(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="space-y-2">
        {store.expenses.map((e) => (
          <div key={e.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[e.category] ?? "#9CA3AF" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
              <p className="text-xs text-gray-400">{e.date?.toString().slice(0, 10)} · {e.category}</p>
            </div>
            <span className="font-semibold text-gray-900">{settings.formatCurrency(e.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BudgetPanel;
