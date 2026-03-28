import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import type { Trip } from "@friendinerary/types";
import { Compass, Search, Utensils, Landmark, Hotel, Bike, ShoppingBag, Trees } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: "", icon: <Compass className="w-4 h-4" /> },
  { label: "Restaurants", value: "restaurants", icon: <Utensils className="w-4 h-4" /> },
  { label: "Attractions", value: "attractions", icon: <Landmark className="w-4 h-4" /> },
  { label: "Hotels", value: "hotels", icon: <Hotel className="w-4 h-4" /> },
  { label: "Activities", value: "activities", icon: <Bike className="w-4 h-4" /> },
  { label: "Shopping", value: "shopping", icon: <ShoppingBag className="w-4 h-4" /> },
  { label: "Outdoors", value: "outdoors", icon: <Trees className="w-4 h-4" /> },
];

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-rose-500 to-orange-500",
];

const ExplorePanel = observer(({ trip }: { trip: Trip }) => {
  const { explore } = useStore();

  useEffect(() => {
    if (trip.destinations[0]) {
      explore.setDestination(trip.destinations[0].split(",")[0] ?? "");
    } else {
      explore.fetchGuides();
    }
  }, [trip.id]);

  return (
    <div className="p-5 max-w-3xl">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white dark:bg-gray-900"
          placeholder="Search destination..."
          defaultValue={explore.destination}
          onChange={(e) => explore.setDestination(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = (!explore.category && cat.value === "") || explore.category === cat.value;
          return (
            <button
              key={cat.label}
              onClick={() => explore.setCategory(cat.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Guides */}
      {explore.loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="p-4 bg-white dark:bg-gray-900 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : explore.guides.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">No guides found for this destination</p>
          <p className="text-xs text-gray-300 mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {explore.guides.map((guide, i) => (
            <div
              key={guide.id}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className={`h-36 bg-gradient-to-br ${gradients[i % gradients.length]} relative overflow-hidden`}>
                {guide.coverPhotoUrl && (
                  <img
                    src={guide.coverPhotoUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{guide.title}</p>
                <p className="text-xs text-gray-400 truncate mt-1">{guide.authorName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ExplorePanel;
