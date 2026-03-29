import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import { api } from "../lib/api";
import {
  User,
  Pencil,
  Share2,
  MapPin,
  Globe,
  Trophy,
  Calendar,
  BookOpen,
  Compass,
  X,
  Search,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import type { UserProfile, VisitedPlaceEntry } from "@friendinerary/types";
import toast from "react-hot-toast";

// ─── Travel rank badge ──────────────────────────────────────────────────────
function getTravelRank(countries: number): { label: string; emoji: string } {
  if (countries >= 50) return { label: "Globe Trotter", emoji: "🌍" };
  if (countries >= 25) return { label: "World Explorer", emoji: "✈️" };
  if (countries >= 10) return { label: "Seasoned Traveler", emoji: "🧳" };
  if (countries >= 5) return { label: "Adventurer", emoji: "🏔️" };
  if (countries >= 1) return { label: "Travel Beginner", emoji: "🌱" };
  return { label: "Travel Newcomer", emoji: "👋" };
}

// ─── Profile Card ───────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  isOwnProfile,
  onEdit,
  onShare,
  onFollow,
  onUnfollow,
}: {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEdit: () => void;
  onShare: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative mb-4">
        {profile.profilePhoto ? (
          <img
            src={profile.profilePhoto}
            alt={profile.displayName}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700 shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg ring-4 ring-gray-100 dark:ring-gray-700">
            {profile.displayName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h2>
      {profile.username && (
        <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
      )}

      {/* Followers / Following */}
      <div className="flex items-center gap-6 mt-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.followerCount ?? 0}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.followingCount ?? 0}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Following</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 mt-5 w-full">
        {isOwnProfile ? (
          <>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </>
        ) : (
          <>
            {profile.isFollowing ? (
              <button
                onClick={onUnfollow}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Following
              </button>
            ) : (
              <button
                onClick={onFollow}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Follow
              </button>
            )}
            <button
              onClick={onShare}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Travel Stats + Map Preview ─────────────────────────────────────────────
function TravelMapCard({
  profile,
  isOwnProfile,
  onExpand,
}: {
  profile: UserProfile;
  isOwnProfile: boolean;
  onExpand: () => void;
}) {
  const rank = getTravelRank(profile.countriesCount);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden h-full flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-gray-800 dark:bg-gray-950 text-white">
        <div className="text-center">
          <p className="text-lg font-bold">{profile.countriesCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-300">Countries</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{profile.visitedPlacesCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-300">Cities & Regions</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-lg">{rank.emoji}</span>
          <span className="text-sm font-medium">{rank.label}</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[280px] cursor-pointer" onClick={onExpand}>
        <Map
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={1.5}
          mapId="profile-travel-map"
          gestureHandling="cooperative"
          disableDefaultUI
          className="w-full h-full"
        >
          {profile.visitedPlaces.map((place) => (
            <AdvancedMarker key={place.id} position={{ lat: place.lat, lng: place.lng }}>
              <Pin background="#f97316" glyphColor="#fff" borderColor="#ea580c" scale={0.8} />
            </AdvancedMarker>
          ))}
        </Map>
        {isOwnProfile && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors backdrop-blur-sm"
          >
            + Add places
          </button>
        )}
      </div>

      {/* Travel leaderboard link */}
      <button className="flex items-center gap-2 px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800">
        <Trophy className="w-4 h-4" />
        Travel leaderboard
      </button>
    </div>
  );
}

// ─── Expanded World Map Modal ───────────────────────────────────────────────
function WorldMapModal({
  places,
  isOwnProfile,
  onClose,
  onAddPlace,
  onRemovePlace,
}: {
  places: VisitedPlaceEntry[];
  isOwnProfile: boolean;
  onClose: () => void;
  onAddPlace: (place: { name: string; country: string; lat: number; lng: number }) => void;
  onRemovePlace: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<VisitedPlaceEntry | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const map = useMap("world-map-expanded");
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (typeof google !== "undefined" && google.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, []);

  useEffect(() => {
    if (map && typeof google !== "undefined" && google.maps?.places) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [map]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !autocompleteServiceRef.current) {
      setSearchResults([]);
      return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, types: ["(cities)"] },
      (predictions) => {
        setSearchResults(predictions ?? []);
      }
    );
  }, []);

  const handleSelectSearchResult = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name", "address_components"] },
      (result) => {
        if (!result?.geometry?.location) return;
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const country = result.address_components?.find((c) =>
          c.types.includes("country")
        )?.long_name ?? "";
        const name = prediction.structured_formatting.main_text;
        onAddPlace({ name, country, lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(6);
        setSearchQuery("");
        setSearchResults([]);
      }
    );
  }, [map, onAddPlace]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-800 dark:bg-gray-950 text-white z-10">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold">{new Set(places.map((p) => p.country).filter(Boolean)).size}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-300">Countries</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{places.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-300">Cities & Regions</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span>{getTravelRank(new Set(places.map((p) => p.country).filter(Boolean)).size).emoji}</span>
            <span className="text-sm">{getTravelRank(new Set(places.map((p) => p.country).filter(Boolean)).size).label}</span>
          </div>
        </div>

        {/* Search */}
        {isOwnProfile && (
          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Add somewhere you've been"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50">
                {searchResults.map((r) => (
                  <button
                    key={r.place_id}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{r.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/50 text-sm text-gray-300 hover:bg-gray-600/50 transition-colors ml-4"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>

      {/* Full map */}
      <div className="flex-1 relative">
        <Map
          id="world-map-expanded"
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={2}
          mapId="profile-world-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          className="w-full h-full"
        >
          {places.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              onClick={() => setSelectedPlace(place)}
            >
              <Pin background="#f97316" glyphColor="#fff" borderColor="#ea580c" />
            </AdvancedMarker>
          ))}
        </Map>

        {/* Place info popup */}
        {selectedPlace && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 min-w-[200px] z-50">
            <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedPlace.name}</p>
              {selectedPlace.country && (
                <p className="text-xs text-gray-400">{selectedPlace.country}</p>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => { onRemovePlace(selectedPlace.id); setSelectedPlace(null); }}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Remove place"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSelectedPlace(null)}
              className="p-1 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Travel leaderboard button */}
        <button className="absolute bottom-6 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-sm text-gray-600 dark:text-gray-400 shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors backdrop-blur-sm">
          <Trophy className="w-4 h-4" />
          Travel leaderboard
        </button>
      </div>
    </div>
  );
}

// ─── Trip Card ──────────────────────────────────────────────────────────────
function TripCard({ trip }: { trip: UserProfile["trips"][number] }) {
  const { settings } = useStore();
  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="aspect-[16/10] bg-gradient-to-br from-brand-100 to-amber-100 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
        {trip.coverPhotoUrl ? (
          <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-12 h-12 text-brand-300/50" />
          </div>
        )}
        {trip.startDate && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-brand-500 text-white text-[10px] font-semibold shadow">
            {new Date(trip.startDate) > new Date()
              ? `In ${Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000)} days`
              : settings.formatShortDate(trip.startDate)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{trip.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {settings.formatShortDate(trip.startDate)}
              {trip.endDate && ` - ${settings.formatShortDate(trip.endDate)}`}
            </span>
          )}
          {trip.destinations.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.destinations[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Story/Journal Card ─────────────────────────────────────────────────────
function StoryCard({ story }: { story: UserProfile["stories"][number] }) {
  const { settings } = useStore();
  return (
    <Link
      to={`/story/${story.shareSlug}`}
      className="group block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="aspect-[16/10] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
        {story.coverPhotoUrl ? (
          <img src={story.coverPhotoUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-purple-300/50" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{story.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{settings.formatShortDate(story.createdAt)}</p>
      </div>
    </Link>
  );
}

// ─── Main Profile Page ──────────────────────────────────────────────────────
const ProfilePage = observer(() => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { auth } = useStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trips" | "guides" | "journals">("trips");
  const [mapExpanded, setMapExpanded] = useState(false);

  const isOwnProfile = userId === auth.user?.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data } = await api.get<{ data: UserProfile }>(`/users/${userId}/profile`);
      setProfile(data.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      await api.post(`/users/${userId}/follow`);
      setProfile((p) => p ? { ...p, isFollowing: true, followerCount: (p.followerCount ?? 0) + 1 } : p);
      toast.success("Followed!");
    } catch {
      toast.error("Failed to follow");
    }
  };

  const handleUnfollow = async () => {
    if (!userId) return;
    try {
      await api.delete(`/users/${userId}/follow`);
      setProfile((p) => p ? { ...p, isFollowing: false, followerCount: Math.max(0, (p.followerCount ?? 1) - 1) } : p);
      toast.success("Unfollowed");
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const handleAddPlace = async (place: { name: string; country: string; lat: number; lng: number }) => {
    try {
      const { data } = await api.post<{ data: VisitedPlaceEntry }>("/users/me/traveled-places", place);
      setProfile((p) => {
        if (!p) return p;
        const newPlaces = [data.data, ...p.visitedPlaces];
        const countries = new Set(newPlaces.map((pl) => pl.country).filter(Boolean));
        return { ...p, visitedPlaces: newPlaces, visitedPlacesCount: newPlaces.length, countriesCount: countries.size };
      });
      toast.success(`Added ${place.name}`);
    } catch {
      toast.error("Place already added or failed");
    }
  };

  const handleRemovePlace = async (placeId: string) => {
    try {
      await api.delete(`/users/me/traveled-places/${placeId}`);
      setProfile((p) => {
        if (!p) return p;
        const newPlaces = p.visitedPlaces.filter((pl) => pl.id !== placeId);
        const countries = new Set(newPlaces.map((pl) => pl.country).filter(Boolean));
        return { ...p, visitedPlaces: newPlaces, visitedPlacesCount: newPlaces.length, countriesCount: countries.size };
      });
      toast.success("Place removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 gap-4">
        <User className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 text-lg">Profile not found</p>
        <button onClick={() => navigate("/dashboard")} className="text-brand-500 hover:underline text-sm">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { key: "trips" as const, label: "Trip plans", icon: <Compass className="w-4 h-4" />, count: profile.trips.length },
    { key: "guides" as const, label: "Guides", icon: <BookOpen className="w-4 h-4" />, count: 0 },
    { key: "journals" as const, label: "Journals", icon: <BookOpen className="w-4 h-4" />, count: profile.stories.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Back button for non-layout pages */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Top section: Profile card + Travel map */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <ProfileCard
            profile={profile}
            isOwnProfile={isOwnProfile}
            onEdit={() => navigate("/settings?section=profile")}
            onShare={handleShare}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
          />
          <TravelMapCard
            profile={profile}
            isOwnProfile={isOwnProfile}
            onExpand={() => setMapExpanded(true)}
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "trips" && (
            <div>
              {profile.trips.length === 0 ? (
                <div className="text-center py-16">
                  <Globe className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">No trip plans yet</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="mt-3 text-sm text-brand-500 hover:underline"
                    >
                      Create your first trip
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "guides" && (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">No guides yet</p>
              {isOwnProfile && (
                <p className="text-xs text-gray-300 mt-1">Create a guide to share travel tips with others</p>
              )}
            </div>
          )}

          {activeTab === "journals" && (
            <div>
              {profile.stories.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">No journals yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded world map modal */}
      {mapExpanded && (
        <WorldMapModal
          places={profile.visitedPlaces}
          isOwnProfile={isOwnProfile}
          onClose={() => setMapExpanded(false)}
          onAddPlace={handleAddPlace}
          onRemovePlace={handleRemovePlace}
        />
      )}
    </div>
  );
});

export default ProfilePage;
