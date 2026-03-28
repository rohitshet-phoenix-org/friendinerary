import { observer } from "mobx-react-lite";
import type { Trip } from "@friendinerary/types";
import { MapPin, Calendar, Users, DollarSign, Plane, Mail, ArrowRight } from "lucide-react";

import { useStore } from "../../stores/RootStore";

const OverviewPanel = observer(({ trip }: { trip: Trip }) => {
  const { budget: budgetStore, ui, settings } = useStore();

  const totalPlaces = trip.sections.reduce((s, sec) => s + sec.placeItems.length, 0);
  const dayCount = trip.sections.filter((s) => s.type === "day").length;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Trip title & description */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{trip.name}</h2>
        {trip.destinations.length > 0 && (
          <p className="text-gray-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500" />
            {trip.destinations.join(", ")}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={<Calendar className="w-5 h-5" />}
          label="Dates"
          value={trip.startDate ? `${settings.formatShortDate(trip.startDate)} – ${trip.endDate ? settings.formatDate(trip.endDate) : "TBD"}` : "No dates set"}
          color="bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <InfoCard
          icon={<MapPin className="w-5 h-5" />}
          label="Places"
          value={`${totalPlaces} places across ${dayCount} days`}
          color="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <InfoCard
          icon={<Users className="w-5 h-5" />}
          label="Collaborators"
          value={`${trip.collaborators?.length ?? 0} traveler${(trip.collaborators?.length ?? 0) !== 1 ? "s" : ""}`}
          color="bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <InfoCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Budget"
          value={budgetStore.budget ? `${settings.formatCurrency(budgetStore.budget.totalBudget)} ${budgetStore.budget.currency}` : "Not set"}
          color="bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400"
          onClick={() => ui.setActiveTab("budget")}
        />
        <InfoCard
          icon={<Plane className="w-5 h-5" />}
          label="Reservations"
          value={`${trip.reservations?.length ?? 0} imported`}
          color="bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400"
          onClick={() => ui.setActiveTab("reservations")}
        />
      </div>

      {/* Inbound email for forwarding */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-brand-900/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Forward reservation emails</p>
            <p className="text-xs text-gray-400">Auto-import booking confirmations</p>
          </div>
        </div>
        <code className="text-xs bg-gray-50 dark:bg-gray-800 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 block truncate border border-gray-100 dark:border-gray-700 font-mono">
          {(trip as unknown as { inboundEmail?: string }).inboundEmail ?? "Loading..."}
        </code>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <QuickAction label="Add places" onClick={() => ui.setActiveTab("itinerary")} />
        <QuickAction label="Track budget" onClick={() => ui.setActiveTab("budget")} />
        <QuickAction label="Explore guides" onClick={() => ui.setActiveTab("explore")} />
      </div>
    </div>
  );
});

function InfoCard({ icon, label, value, color, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""
      }`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 hover:text-brand-500 dark:hover:bg-brand-900/10 transition-all border border-gray-100 dark:border-gray-700"
    >
      {label}
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}

export default OverviewPanel;
