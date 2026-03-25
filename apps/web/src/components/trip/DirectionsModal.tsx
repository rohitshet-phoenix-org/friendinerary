import { useState } from "react";
import { observer } from "mobx-react-lite";
import { X, Navigation, Car, Footprints, Train, Bike, ChevronRight, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";
import type { PlaceItem } from "@friendinerary/types";

interface Route {
  summary: string;
  distanceText: string;
  durationText: string;
  steps: { instruction: string; distanceText: string; durationText: string; travelMode: string }[];
}

interface DirectionsModalProps {
  tripId: string;
  placeItems: PlaceItem[];
  onClose: () => void;
}

const TRAVEL_MODES = [
  { id: "driving", label: "Drive", icon: Car },
  { id: "walking", label: "Walk", icon: Footprints },
  { id: "transit", label: "Transit", icon: Train },
  { id: "bicycling", label: "Bike", icon: Bike },
] as const;

const DirectionsModal = observer(({ tripId, placeItems, onClose }: DirectionsModalProps) => {
  const [originId, setOriginId] = useState(placeItems[0]?.id ?? "");
  const [destId, setDestId] = useState(placeItems[1]?.id ?? "");
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "transit" | "bicycling">("driving");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRouteIdx, setActiveRouteIdx] = useState(0);

  const fetchDirections = async () => {
    if (!originId || !destId || originId === destId) {
      toast.error("Please select two different places");
      return;
    }
    const origin = placeItems.find((p) => p.id === originId);
    const dest = placeItems.find((p) => p.id === destId);
    if (!origin?.place.id || !dest?.place.id) {
      toast.error("Places missing location data");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get<{ data: { routes: Route[] } }>(
        `/trips/${tripId}/directions`,
        { params: { originPlaceId: origin.place.id, destPlaceId: dest.place.id, travelMode } }
      );
      setRoutes(data.data.routes);
      setActiveRouteIdx(0);
    } catch {
      toast.error("Could not fetch directions");
    } finally {
      setLoading(false);
    }
  };

  const activeRoute = routes[activeRouteIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Get Directions</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* From / To selectors */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="input text-sm"
              >
                {placeItems.map((p) => (
                  <option key={p.id} value={p.id}>{p.place.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="input text-sm"
              >
                {placeItems.map((p) => (
                  <option key={p.id} value={p.id}>{p.place.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Travel mode */}
          <div className="flex gap-2">
            {TRAVEL_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTravelMode(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                  travelMode === id
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDirections}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {loading ? "Getting directions..." : "Get directions"}
          </button>

          {/* Route alternatives */}
          {routes.length > 1 && (
            <div className="flex gap-2">
              {routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setActiveRouteIdx(i)}
                  className={`flex-1 text-xs py-1.5 px-2 rounded-lg border transition-colors ${
                    activeRouteIdx === i
                      ? "border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-500"
                  }`}
                >
                  {r.durationText} · {r.distanceText}
                </button>
              ))}
            </div>
          )}

          {/* Active route summary */}
          {activeRoute && (
            <div className="space-y-2">
              <div className="card p-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activeRoute.summary || "Best route"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activeRoute.durationText} · {activeRoute.distanceText}</p>
              </div>

              {/* Steps */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {activeRoute.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-500">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                      <p className="text-xs text-gray-400 mt-0.5">{step.durationText} · {step.distanceText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DirectionsModal;
