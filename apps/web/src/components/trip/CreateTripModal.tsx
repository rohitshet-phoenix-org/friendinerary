import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { X, MapPin, Calendar, Globe } from "lucide-react";
import toast from "react-hot-toast";

const CreateTripModal = observer(() => {
  const { trips, ui } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [withDates, setWithDates] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const trip = await trips.createTrip({
        name: name.trim(),
        destinations: destination.trim() ? [destination.trim()] : [],
        ...(withDates && startDate && endDate && { startDate, endDate }),
      });
      ui.closeCreateTripModal();
      toast.success("Trip created!");
      navigate(`/trip/${trip.id}`);
    } catch {
      toast.error("Failed to create trip");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create a new trip</h2>
          <button onClick={() => ui.closeCreateTripModal()} className="btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trip name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trip name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="e.g. Japan Summer 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="e.g. Tokyo, Japan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          {/* Dates toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWithDates(!withDates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                withDates ? "bg-brand-500" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${withDates ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => setWithDates(!withDates)}>
              Set travel dates
            </label>
          </div>

          {/* Date fields */}
          {withDates && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="input pl-9"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="input pl-9"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => ui.closeCreateTripModal()} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={trips.saving || !name.trim()} className="btn-primary flex-1">
              {trips.saving ? "Creating..." : "Create trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CreateTripModal;
