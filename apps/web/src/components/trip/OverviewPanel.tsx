import { observer } from "mobx-react-lite";
import type { Trip } from "@friendinerary/types";
import { MapPin, Calendar, Users, DollarSign, FileText, Plane } from "lucide-react";
import { format } from "date-fns";
import { useStore } from "../../stores/RootStore";

const OverviewPanel = observer(({ trip }: { trip: Trip }) => {
  const { budget: budgetStore, ui } = useStore();

  const totalPlaces = trip.sections.reduce((s, sec) => s + sec.placeItems.length, 0);
  const dayCount = trip.sections.filter((s) => s.type === "day").length;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{trip.name}</h2>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard icon={<MapPin className="w-4 h-4" />} label="Destinations" value={trip.destinations.join(", ") || "Not set"} />
        <InfoCard
          icon={<Calendar className="w-4 h-4" />}
          label="Dates"
          value={trip.startDate ? `${format(new Date(trip.startDate), "MMM d")} – ${trip.endDate ? format(new Date(trip.endDate), "MMM d, yyyy") : "TBD"}` : "No dates set"}
        />
        <InfoCard icon={<MapPin className="w-4 h-4" />} label="Places" value={`${totalPlaces} places across ${dayCount} days`} />
        <InfoCard icon={<Users className="w-4 h-4" />} label="Collaborators" value={`${trip.collaborators?.length ?? 0} traveler${(trip.collaborators?.length ?? 0) !== 1 ? "s" : ""}`} />
        <InfoCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Budget"
          value={budgetStore.budget ? `$${budgetStore.budget.totalBudget.toLocaleString()} ${budgetStore.budget.currency}` : "Not set"}
          onClick={() => ui.setActiveTab("budget")}
        />
        <InfoCard icon={<Plane className="w-4 h-4" />} label="Reservations" value={`${trip.reservations?.length ?? 0} imported`} />
      </div>

      {/* Inbound email for forwarding */}
      <div className="card p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forward reservation emails to:</p>
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 block truncate">
          {(trip as unknown as { inboundEmail?: string }).inboundEmail ?? "Loading..."}
        </code>
        <p className="text-xs text-gray-400 mt-1">Forward any booking confirmation email here and we'll auto-import it.</p>
      </div>
    </div>
  );
});

function InfoCard({ icon, label, value, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card p-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

export default OverviewPanel;
