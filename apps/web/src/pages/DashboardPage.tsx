import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";

import { Plus, MapPin, Calendar, Users, MoreVertical, Globe, Plane } from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/ui/AppLayout";
import CreateTripModal from "../components/trip/CreateTripModal";
import type { TripSummary } from "@friendinerary/types";

const coverGradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-rose-500 to-orange-500",
];

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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {auth.user?.displayName?.split(" ")[0]}!
            </h1>
            <p className="text-gray-500 mt-1">
              {trips.trips.length === 0
                ? "Plan your first adventure"
                : `You have ${trips.trips.length} trip${trips.trips.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => ui.openCreateTripModal()}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        </div>

        {/* Trip Grid */}
        {trips.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="h-40 bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="p-5 bg-white dark:bg-gray-900 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.trips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-6">
              <Plane className="w-12 h-12 text-brand-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No trips yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start planning your first adventure. Create a trip, add destinations, and invite friends to collaborate!
            </p>
            <button
              onClick={() => ui.openCreateTripModal()}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.trips.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                gradientClass={coverGradients[i % coverGradients.length]!}
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
  gradientClass,
  onOpen,
  onDelete,
}: {
  trip: TripSummary;
  gradientClass: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { settings } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 group hover:-translate-y-1"
      onClick={onOpen}
    >
      {/* Cover */}
      <div className={`h-40 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
        {trip.coverPhotoUrl && (
          <img
            src={trip.coverPhotoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Menu button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg mx-auto transition-colors"
              >
                Delete trip
              </button>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${
            trip.status === "completed" ? "bg-green-500/20 text-green-100 border border-green-400/30" :
            trip.status === "active" ? "bg-blue-500/20 text-blue-100 border border-blue-400/30" :
            "bg-white/20 text-white border border-white/30"
          }`}>
            {trip.status}
          </span>
        </div>

        {/* Destination overlay text */}
        <div className="absolute bottom-3 right-3">
          <Globe className="w-5 h-5 text-white/60" />
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{trip.name}</h3>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
          <span className="truncate">{trip.destinations.join(", ") || "No destination"}</span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {trip.startDate
              ? settings.formatDate(trip.startDate)
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
