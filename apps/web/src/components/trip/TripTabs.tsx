import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { LayoutList, Map, Compass, DollarSign, LayoutDashboard, Ticket, BookOpen, Hotel } from "lucide-react";
import type { TripTab } from "../../stores/UIStore";

const TABS: { id: TripTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "itinerary", label: "Itinerary", icon: <LayoutList className="w-4 h-4" /> },
  { id: "reservations", label: "Bookings", icon: <Ticket className="w-4 h-4" /> },
  { id: "hotels", label: "Hotels", icon: <Hotel className="w-4 h-4" /> },
  { id: "stories", label: "Stories", icon: <BookOpen className="w-4 h-4" /> },
  { id: "map", label: "Map", icon: <Map className="w-4 h-4" /> },
  { id: "explore", label: "Explore", icon: <Compass className="w-4 h-4" /> },
  { id: "budget", label: "Budget", icon: <DollarSign className="w-4 h-4" /> },
];

const TripTabs = observer(() => {
  const { ui } = useStore();

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 px-4 overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => ui.setActiveTab(tab.id)}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            ui.activeTab === tab.id
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
});

export default TripTabs;
