import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { api } from "../../lib/api";
import { useStore } from "../../stores/RootStore";
import type { Reservation } from "@friendinerary/types";
import {
  Plane, Hotel, Car, Ticket, Plus, Trash2, Upload,
  Calendar, Clock, MapPin, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

const RESERVATION_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  hotel: <Hotel className="w-4 h-4" />,
  car_rental: <Car className="w-4 h-4" />,
  activity: <Ticket className="w-4 h-4" />,
};

const ReservationsPanel = observer(({ tripId }: { tripId: string }) => {
  const { auth } = useStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadReservations = async () => {
    try {
      const { data } = await api.get<{ data: Reservation[] }>(`/trips/${tripId}/reservations`);
      setReservations(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [tripId]);

  const handleParseEmail = async () => {
    if (!emailBody.trim()) return;
    setParsing(true);
    try {
      const { data } = await api.post<{ data: Reservation }>(`/trips/${tripId}/reservations/parse-email`, {
        emailBody,
      });
      setReservations((prev) => [data.data, ...prev]);
      setEmailBody("");
      setShowEmailInput(false);
      toast.success("Reservation parsed and saved!");
    } catch {
      toast.error("Could not parse email. Try a different format.");
    } finally {
      setParsing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/trips/${tripId}/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reservation removed");
    } catch {
      toast.error("Failed to remove reservation");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservations</h2>
        <button
          onClick={() => setShowEmailInput(!showEmailInput)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Parse email
        </button>
      </div>

      {/* Email parser */}
      {showEmailInput && (
        <div className="card p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Paste your booking confirmation email and we'll extract the details automatically.
          </p>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Paste email content here..."
            rows={6}
            className="input text-sm font-mono resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleParseEmail}
              disabled={parsing || !emailBody.trim()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
              {parsing ? "Parsing..." : "Extract reservation"}
            </button>
            <button onClick={() => setShowEmailInput(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reservations list */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reservations yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Forward booking confirmation emails to your trip's inbound address, or paste them above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((res) => (
            <ReservationCard
              key={res.id}
              reservation={res}
              expanded={expandedId === res.id}
              onToggle={() => setExpandedId(expandedId === res.id ? null : res.id)}
              onDelete={() => handleDelete(res.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function ReservationCard({
  reservation, expanded, onToggle, onDelete
}: {
  reservation: Reservation;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const typeColors: Record<string, string> = {
    flight: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    hotel: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    car_rental: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    activity: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  const colorClass = typeColors[reservation.type] ?? typeColors.activity!;

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          {RESERVATION_ICONS[reservation.type] ?? <Ticket className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {reservation.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {reservation.confirmationCode && (
              <span className="font-mono">{reservation.confirmationCode} · </span>
            )}
            {reservation.provider}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {reservation.startDate && (
            <span className="text-xs text-gray-400">
              {format(new Date(reservation.startDate), "MMM d")}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2 bg-gray-50 dark:bg-gray-800/30">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {reservation.startDate && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(reservation.startDate), "MMM d, yyyy")}</span>
              </div>
            )}
            {reservation.endDate && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Until {format(new Date(reservation.endDate), "MMM d, yyyy")}</span>
              </div>
            )}
            {(reservation as { location?: string }).location && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{(reservation as { location?: string }).location}</span>
              </div>
            )}
          </div>

          {reservation.rawData && typeof reservation.rawData === "object" && (
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(reservation.rawData as Record<string, unknown>)
                .filter(([k]) => !["id", "tripId", "title", "type", "provider", "confirmationCode"].includes(k))
                .slice(0, 6)
                .map(([key, val]) => val != null && (
                  <div key={key} className="text-xs">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                    <span className="text-gray-700 dark:text-gray-300">{String(val)}</span>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsPanel;
