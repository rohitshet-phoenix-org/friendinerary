import { useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { useStore } from "../../stores/RootStore";
import type { Trip } from "@friendinerary/types";
import { Layers, Maximize2, Minimize2, Navigation } from "lucide-react";

interface MapPanelProps {
  trip: Trip;
  fullscreen?: boolean;
}

const SECTION_COLORS = [
  "#F97316", "#8B5CF6", "#3B82F6", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899", "#06B6D4",
];

const MapPanel = observer(({ trip, fullscreen }: MapPanelProps) => {
  const { map: mapStore, ui } = useStore();

  // Compute all visible places
  const visiblePlaces = trip.sections
    .filter((s) => mapStore.isLayerVisible(s.id))
    .flatMap((s, sIdx) =>
      s.placeItems
        .filter((p) => p.place.coordinates.lat && p.place.coordinates.lng)
        .map((p) => ({
          ...p,
          sectionColor: SECTION_COLORS[sIdx % SECTION_COLORS.length] ?? "#F97316",
          sectionName: s.name,
        }))
    );

  // Auto-fit bounds when places change
  const handleMapLoad = useCallback(() => {
    if (visiblePlaces.length > 0) {
      const first = visiblePlaces[0]!;
      mapStore.setCenter({ lat: first.place.coordinates.lat, lng: first.place.coordinates.lng });
      mapStore.setZoom(12);
    }
  }, [visiblePlaces.length]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Map controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer toggle */}
        <div className="relative group">
          <button className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50">
            <Layers className="w-4 h-4 text-gray-600" />
          </button>
          {/* Layer panel */}
          <div className="absolute right-10 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-52 hidden group-hover:block">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Layers</p>
            {trip.sections.map((section, idx) => (
              <label key={section.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapStore.isLayerVisible(section.id)}
                  onChange={() => mapStore.toggleLayer(section.id)}
                  className="accent-brand-500"
                />
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SECTION_COLORS[idx % SECTION_COLORS.length] }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{section.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fullscreen toggle */}
        {!fullscreen && (
          <button
            onClick={() => ui.toggleMapFullscreen()}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:bg-gray-50"
          >
            {ui.mapFullscreen
              ? <Minimize2 className="w-4 h-4 text-gray-600" />
              : <Maximize2 className="w-4 h-4 text-gray-600" />}
          </button>
        )}
      </div>

      {/* Google Map */}
      <Map
        className="w-full h-full"
        center={mapStore.center}
        zoom={mapStore.zoom}
        onCameraChanged={(ev) => {
          mapStore.setCenter(ev.detail.center);
          mapStore.setZoom(ev.detail.zoom);
        }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="friendinerary-map"
        onIdle={handleMapLoad}
      >
        {visiblePlaces.map((item, idx) => (
          <AdvancedMarker
            key={item.id}
            position={{ lat: item.place.coordinates.lat, lng: item.place.coordinates.lng }}
            onClick={() => {
              mapStore.panTo({ lat: item.place.coordinates.lat, lng: item.place.coordinates.lng });
            }}
          >
            <Pin
              background={
                ui.selectedPlaceItemId === item.id
                  ? "#1F2937"
                  : item.sectionColor
              }
              borderColor="white"
              glyphColor="white"
            />
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
});

export default MapPanel;
