import { useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { ArrowLeft, Share2, Users, Bot, MoreHorizontal, MapPin, Calendar, Download, Navigation } from "lucide-react";
import { format } from "date-fns";
import type { Trip } from "@friendinerary/types";
import toast from "react-hot-toast";

interface TripHeaderProps {
  trip: Trip;
}

const TripHeader = observer(({ trip }: TripHeaderProps) => {
  const { ui, collaboration } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyShareLink = async () => {
    try {
      const link = await collaboration.generateShareLink(trip.id, "view");
      await navigator.clipboard.writeText(link.url);
      toast.success("Share link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4 flex-shrink-0">
      {/* Back */}
      <Link to="/dashboard" className="btn-ghost p-1.5">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Trip info */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 dark:text-white truncate text-lg">{trip.name}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          {trip.destinations.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {trip.destinations.join(", ")}
            </span>
          )}
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(trip.startDate), "MMM d")}
              {trip.endDate && ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
            </span>
          )}
        </div>
      </div>

      {/* Active collaborators avatars */}
      {collaboration.activeUsers.length > 0 && (
        <div className="flex -space-x-2">
          {collaboration.activeUsers.slice(0, 4).map((u) => (
            <div
              key={u.userId}
              className="w-7 h-7 rounded-full border-2 border-white bg-brand-400 flex items-center justify-center text-white text-xs font-medium"
              title={u.displayName}
            >
              {u.profilePhoto
                ? <img src={u.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                : u.displayName[0]?.toUpperCase()}
            </div>
          ))}
          {collaboration.activeUsers.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs text-gray-600">
              +{collaboration.activeUsers.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => ui.toggleAIPanel()} className={`btn-ghost p-2 ${ui.aiPanelOpen ? "bg-brand-50 text-brand-600" : ""}`} title="AI Assistant">
          <Bot className="w-5 h-5" />
        </button>
        <button onClick={() => ui.openInviteModal()} className="btn-ghost p-2" title="Invite collaborators">
          <Users className="w-5 h-5" />
        </button>
        <button onClick={handleCopyShareLink} className="btn-ghost p-2" title="Share trip">
          <Share2 className="w-5 h-5" />
        </button>
        <button onClick={() => ui.openDirectionsModal()} className="btn-ghost p-2" title="Get directions">
          <Navigation className="w-5 h-5" />
        </button>
        <button onClick={() => ui.openExportModal()} className="btn-ghost p-2" title="Export trip">
          <Download className="w-5 h-5" />
        </button>
        <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2 relative">
          <MoreHorizontal className="w-5 h-5" />
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <button
                onClick={() => { ui.openInviteModal(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Invite collaborators
              </button>
              <button
                onClick={() => { ui.openExportModal(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export trip
              </button>
              <button
                onClick={() => { window.print(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Print / Save as PDF
              </button>
            </div>
          )}
        </button>
      </div>
    </div>
  );
});

export default TripHeader;
