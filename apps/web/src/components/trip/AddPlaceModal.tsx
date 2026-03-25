import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { api } from "../../lib/api";
import { Search, X, MapPin, Star, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";

interface AddPlaceModalProps {
  tripId: string;
  sectionId: string;
}

interface PlaceResult {
  googlePlaceId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetail {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  photoUrls: string[];
  description: string | null;
  website: string | null;
  phoneNumber: string | null;
}

const AddPlaceModal = observer(({ tripId, sectionId }: AddPlaceModalProps) => {
  const { trips, ui, map } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    api.get<{ data: PlaceResult[] }>(`/places/autocomplete?input=${encodeURIComponent(debouncedQuery)}`)
      .then(({ data }) => { setResults(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelect = async (result: PlaceResult) => {
    setAdding(true);
    try {
      // Fetch full place details
      const { data } = await api.get<{ data: PlaceDetail }>(`/places/${result.googlePlaceId}`);
      const place = data.data;

      await trips.addPlaceToSection(tripId, sectionId, {
        googlePlaceId: place.googlePlaceId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        photoUrls: place.photoUrls,
        rating: place.rating,
        website: place.website,
        phoneNumber: place.phoneNumber,
        description: place.description,
      });

      // Pan map to the new place
      map.panTo({ lat: place.lat, lng: place.lng }, 14);

      toast.success(`${place.name} added!`);
      ui.closeAddPlace();
    } catch {
      toast.error("Failed to add place");
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-24 px-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        {/* Search input */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for a place..."
              className="input pl-10 pr-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={() => ui.closeAddPlace()}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && results.length === 0 && query.length > 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No places found</div>
          )}

          {!loading && results.length === 0 && query.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              Start typing to search for places
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.googlePlaceId}
              onClick={() => handleSelect(result)}
              disabled={adding}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {result.mainText}
                </p>
                <p className="text-xs text-gray-400 truncate">{result.secondaryText}</p>
              </div>
              <Plus className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default AddPlaceModal;
