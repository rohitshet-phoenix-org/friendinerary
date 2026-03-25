import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import { format } from "date-fns";
import { Plus, MapPin, Calendar, Users, MoreVertical, Plane, Globe } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/ui/AppLayout";
import CreateTripModal from "../components/trip/CreateTripModal";
import type { TripSummary } from "@friendinerary/types";

const DashboardPage = observer(() => {
  const { auth, trips, ui } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    trips.fetchTrips();
  }, [trips]);

  const handleDelete = async (tripId: string) => {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    try {
      await trips.deleteTrip(tripId);
      toast.success("Trip deleted");
    } catch {
      toast.error("Failed to delete trip");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {auth.user?.displayName?.split(" ")[0]}! ✈️
            </h1>
            <p className="text-gray-500 mt-1">
              {trips.trips.length === 0
                ? "Plan your first adventure"
                : `You have ${trips.trips.length} trip${trips.trips.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={() => ui.openCreateTripModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        </div>

        {/* Trip Grid */}
        {trips.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : trips.trips.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No trips yet</h2>
            <p className="text-gray-400 mt-2 mb-6">Start planning your first adventure!</p>
            <button onClick={() => ui.openCreateTripModal()} className="btn-primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              Create your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={() => navigate(`/trip/${trip.id}`)}
                onDelete={() => handleDelete(trip.id)}
              />
            ))}
          </div>
        )}
      </div>

      {ui.createTripModalOpen && <CreateTripModal />}
    </AppLayout>
  );
});

function TripCard({
  trip,
  onOpen,
  onDelete,
}: {
  trip: TripSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onOpen}
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-orange-400 to-amber-500 relative">
        {trip.coverPhotoUrl && (
          <img src={trip.coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete trip
              </button>
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            trip.status === "completed" ? "bg-green-100 text-green-700" :
            trip.status === "active" ? "bg-blue-100 text-blue-700" :
            "bg-white/80 text-gray-700"
          }`}>
            {trip.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{trip.name}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{trip.destinations.join(", ") || "No destination"}</span>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {trip.startDate
              ? format(new Date(trip.startDate), "MMM d, yyyy")
              : "No dates set"}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {trip.placeCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {trip.collaboratorCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
