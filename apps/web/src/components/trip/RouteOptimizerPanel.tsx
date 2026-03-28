import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import type { Section } from "@friendinerary/types";
import { Route, Zap, Clock, MapPin, ChevronRight, Lock } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface LegInfo {
  fromId: string;
  toId: string;
  distanceText: string;
  durationText: string;
}

interface OptimizeResult {
  optimizedIds: string[];
  legs: LegInfo[];
  totalDistanceText: string;
  totalDurationText: string;
}

const RouteOptimizerPanel = observer(({ section, tripId }: { section: Section; tripId: string }) => {
  const { auth, trips, settings } = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "transit" | "bicycling">(settings.defaultTransportMode);

  const places = section.placeItems.filter((p) => {
    const coords = p.place?.coordinates as { lat?: number; lng?: number } | null | undefined;
    return coords?.lat != null && coords?.lng != null;
  });

  if (!auth.isPro) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
        <Lock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">Route optimization is a Pro feature</p>
        <a href="/pro" className="text-xs text-brand-500 hover:underline mt-1 inline-block">
          Upgrade to Pro
        </a>
      </div>
    );
  }

  if (places.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
        <Route className="w-5 h-5 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Add at least 2 places with locations to optimize route</p>
      </div>
    );
  }

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ data: OptimizeResult }>(`/trips/${tripId}/optimize-route`, {
        sectionId: section.id,
        placeItemIds: places.map((p) => p.id),
        travelMode,
      });
      setResult(data.data);
      // Reload trip to get updated order
      await trips.loadTrip(tripId);
      toast.success("Route optimized!");
    } catch {
      toast.error("Failed to optimize route");
    } finally {
      setLoading(false);
    }
  };

  const placeMap = new Map(section.placeItems.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {(["driving", "walking", "transit", "bicycling"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTravelMode(mode)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                travelMode === mode
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="ml-auto btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          {loading ? "Optimizing..." : "Optimize"}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          {/* Summary */}
          <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1 text-green-700 dark:text-green-400 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-medium">{result.totalDistanceText}</span>
            </div>
            <div className="flex items-center gap-1 text-green-700 dark:text-green-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{result.totalDurationText}</span>
            </div>
            <span className="text-xs text-green-600 dark:text-green-500 ml-auto">Route applied ✓</span>
          </div>

          {/* Legs */}
          <div className="space-y-1">
            {result.legs.map((leg, i) => {
              const from = placeMap.get(leg.fromId);
              const to = placeMap.get(leg.toId);
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="truncate max-w-[100px]">{from?.place?.name ?? "Place"}</span>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">{to?.place?.name ?? "Place"}</span>
                  <span className="ml-auto flex-shrink-0 text-gray-400">{leg.durationText} · {leg.distanceText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default RouteOptimizerPanel;
