import { useEffect } from "react";
import { useParams, Routes, Route } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import TripHeader from "../../components/trip/TripHeader";
import TripTabs from "../../components/trip/TripTabs";
import ItineraryPanel from "../../components/trip/ItineraryPanel";
import MapPanel from "../../components/map/MapPanel";
import BudgetPanel from "../../components/budget/BudgetPanel";
import ExplorePanel from "../../components/explore/ExplorePanel";
import OverviewPanel from "../../components/trip/OverviewPanel";
import AIAssistantPanel from "../../components/ai/AIAssistantPanel";
import AddPlaceModal from "../../components/trip/AddPlaceModal";
import InviteModal from "../../components/trip/InviteModal";
import ExportModal from "../../components/trip/ExportModal";
import DirectionsModal from "../../components/trip/DirectionsModal";
import ReservationsPanel from "../../components/trip/ReservationsPanel";
import StoriesPanel from "../../components/trip/StoriesPanel";
import HotelSearchPanel from "../../components/trip/HotelSearchPanel";

const TripPage = observer(() => {
  const { tripId } = useParams<{ tripId: string }>();
  const { trips, ui, collaboration, map, budget, ai } = useStore();

  useEffect(() => {
    if (!tripId) return;
    trips.loadTrip(tripId);
    collaboration.connectToTrip(tripId);
    collaboration.loadCollaborators(tripId);
    budget.loadExpenses(tripId);
    ai.loadThreads(tripId);

    return () => {
      collaboration.disconnectFromTrip();
    };
  }, [tripId]);

  useEffect(() => {
    if (trips.currentTrip?.sections) {
      // Expand all sections by default, show all layers on map
      const ids = trips.currentTrip.sections.map((s) => s.id);
      ui.expandAllSections(ids);
      map.showAllLayers(ids);
    }
  }, [trips.currentTrip?.id]);

  if (trips.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!trips.currentTrip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Trip not found</p>
      </div>
    );
  }

  const trip = trips.currentTrip;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Trip header */}
      <TripHeader trip={trip} />

      {/* Tab bar */}
      <TripTabs />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 overflow-y-auto">
          {ui.activeTab === "overview" && <OverviewPanel trip={trip} />}
          {ui.activeTab === "itinerary" && <ItineraryPanel trip={trip} />}
          {ui.activeTab === "reservations" && <ReservationsPanel tripId={trip.id} />}
          {ui.activeTab === "stories" && <StoriesPanel tripId={trip.id} />}
          {ui.activeTab === "hotels" && <HotelSearchPanel trip={trip} />}
          {ui.activeTab === "budget" && <BudgetPanel tripId={trip.id} />}
          {ui.activeTab === "explore" && <ExplorePanel trip={trip} />}
          {ui.activeTab === "map" && <div className="h-full"><MapPanel trip={trip} fullscreen /></div>}
        </div>

        {/* Right map panel (hidden on map tab since map is the whole view) */}
        {ui.activeTab !== "map" && (
          <div className={`${ui.mapFullscreen ? "fixed inset-0 z-30" : "w-[45%] min-w-[400px]"} border-l border-gray-200 dark:border-gray-700 flex-shrink-0`}>
            <MapPanel trip={trip} />
          </div>
        )}

        {/* AI panel (slide-in overlay) */}
        {ui.aiPanelOpen && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col">
            <AIAssistantPanel tripId={trip.id} />
          </div>
        )}
      </div>

      {/* Modals */}
      {ui.addPlaceModalOpen && ui.addPlaceSectionId && (
        <AddPlaceModal tripId={trip.id} sectionId={ui.addPlaceSectionId} />
      )}
      {ui.inviteModalOpen && <InviteModal tripId={trip.id} />}
      {ui.exportModalOpen && <ExportModal trip={trip} onClose={() => ui.closeExportModal()} />}
      {ui.directionsModalOpen && (
        <DirectionsModal
          tripId={trip.id}
          placeItems={trip.sections.flatMap((s) => s.placeItems)}
          onClose={() => ui.closeDirectionsModal()}
        />
      )}
    </div>
  );
});

export default TripPage;
