export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface HotelSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  starRating: number | null;
  guestRating: number | null;
  reviewCount: number | null;
  photoUrl: string | null;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  provider: string;
  bookingUrl: string;
  amenities: string[];
}

export interface HotelSearchPayload {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  currency?: string;
}

export interface RouteOptimizationPayload {
  sectionId: string;
  placeItemIds: string[];
  startPlaceId?: string;
  endPlaceId?: string;
  mode?: "driving" | "walking" | "transit";
}

export interface RouteOptimizationResult {
  orderedPlaceItemIds: string[];
  totalDurationMinutes: number;
  totalDistanceKm: number;
}
