import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import type { HotelSearchResult } from "@friendinerary/types";
import { api } from "../../lib/api";
import {
  Hotel, Search, Star, MapPin, Calendar, Loader2, Bell, Lock, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { Trip } from "@friendinerary/types";

const HotelSearchPanel = observer(({ trip }: { trip: Trip }) => {
  const { auth } = useStore();
  const [destination, setDestination] = useState(trip.destinations[0]?.split(",")[0] ?? "");
  const [checkIn, setCheckIn] = useState(trip.startDate ? trip.startDate.split("T")[0] : "");
  const [checkOut, setCheckOut] = useState(trip.endDate ? trip.endDate.split("T")[0] : "");
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!destination) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ data: HotelSearchResult[] }>("/hotels/search", {
        params: { destination, checkIn, checkOut, guests },
      });
      setResults(data.data);
      setSearched(true);
    } catch {
      toast.error("Hotel search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPriceAlert = async (hotelId: string, targetPrice: number) => {
    if (!auth.isPro) {
      toast.error("Price alerts require Friendinerary Pro");
      return;
    }
    try {
      await api.post("/hotels/price-alerts", {
        tripId: trip.id,
        hotelId,
        checkIn,
        checkOut,
        targetPrice,
        currency: "USD",
      });
      toast.success("Price alert set! We'll notify you when the price drops.");
    } catch {
      toast.error("Failed to set price alert");
    }
  };

  return (
    <div className="p-4 max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hotels</h2>

      {/* Search form */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="City or area..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="input pl-9"
                value={checkIn ?? ""}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="input pl-9"
                value={checkOut ?? ""}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Guests</label>
            <select
              className="input"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !destination}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Searching..." : "Search hotels"}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-10">
          <Hotel className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No hotels found for this destination</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isPro={auth.isPro}
              onSetAlert={() => handleSetPriceAlert(hotel.id, hotel.pricePerNight * 0.9)}
            />
          ))}
        </div>
      )}

      {!searched && (
        <div className="text-center py-10">
          <Hotel className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Search for hotels</p>
          <p className="text-sm text-gray-400 mt-1">
            Compare prices from multiple booking sites
          </p>
        </div>
      )}
    </div>
  );
});

function HotelCard({
  hotel, isPro, onSetAlert
}: {
  hotel: HotelSearchResult;
  isPro: boolean;
  onSetAlert: () => void;
}) {
  return (
    <div className="card overflow-hidden flex">
      {/* Image */}
      <div className="w-28 h-28 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 relative">
        {hotel.thumbnailUrl && (
          <img src={hotel.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{hotel.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {hotel.starRating > 0 && (
                <div className="flex">
                  {Array.from({ length: Math.floor(hotel.starRating) }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              )}
              {hotel.reviewScore && (
                <span className="text-xs text-gray-500">{hotel.reviewScore}/10 ({hotel.reviewCount} reviews)</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{hotel.address}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
              ${hotel.pricePerNight}
            </p>
            <p className="text-xs text-gray-400">/ night</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {hotel.bookingUrl && (
            <a
              href={hotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
            >
              Book
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={onSetAlert}
            className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg transition-colors ${
              isPro
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPro ? <Bell className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Price alert
          </button>
        </div>
      </div>
    </div>
  );
}

export default HotelSearchPanel;
