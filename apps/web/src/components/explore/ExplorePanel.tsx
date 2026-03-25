import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import type { Trip } from "@friendinerary/types";
import { Compass, Search } from "lucide-react";

const CATEGORIES = ["All", "Restaurants", "Attractions", "Hotels", "Activities", "Shopping", "Outdoors"];

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
    <div className="p-4 max-w-3xl">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search destination..."
          defaultValue={explore.destination}
          onChange={(e) => explore.setDestination(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => explore.setCategory(cat === "All" ? "" : cat.toLowerCase())}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (cat === "All" && !explore.category) || explore.category === cat.toLowerCase()
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guides */}
      {explore.loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : explore.guides.length === 0 ? (
        <div className="text-center py-12">
          <Compass className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No guides found for this destination</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {explore.guides.map((guide) => (
            <div key={guide.id} className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-28 bg-gradient-to-br from-brand-400 to-purple-400 relative">
                {guide.coverPhotoUrl && (
                  <img src={guide.coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{guide.title}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{guide.authorName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ExplorePanel;
