export type PlaceCategory =
  | "restaurant"
  | "cafe"
  | "bar"
  | "hotel"
  | "attraction"
  | "museum"
  | "park"
  | "shopping"
  | "transport"
  | "airport"
  | "activity"
  | "beach"
  | "nightlife"
  | "spa"
  | "other";

export type TransportMode = "driving" | "walking" | "transit" | "cycling" | "flying";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  monday?: [string, string] | null;
  tuesday?: [string, string] | null;
  wednesday?: [string, string] | null;
  thursday?: [string, string] | null;
  friday?: [string, string] | null;
  saturday?: [string, string] | null;
  sunday?: [string, string] | null;
}

export interface Place {
  id: string;
  googlePlaceId: string | null;
  name: string;
  address: string;
  coordinates: Coordinates;
  category: PlaceCategory;
  photoUrls: string[];
  rating: number | null;
  reviewCount: number | null;
  openingHours: OpeningHours | null;
  phoneNumber: string | null;
  website: string | null;
  description: string | null;
  averageTimeSpentMinutes: number | null;
}

export interface PlaceItem {
  id: string;
  sectionId: string;
  tripId: string;
  place: Place;
  order: number;
  startTime: string | null;
  endTime: string | null;
  notes: string;
  transportToNext: TransportLeg | null;
  isChecked: boolean;
  addedByUserId: string;
  createdAt: string;
}

export interface TransportLeg {
  mode: TransportMode;
  durationMinutes: number;
  distanceKm: number;
}

export interface PlaceSearchResult {
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  category: PlaceCategory;
  photoUrl: string | null;
  rating: number | null;
}
