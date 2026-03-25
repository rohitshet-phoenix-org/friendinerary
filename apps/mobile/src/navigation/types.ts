import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

// Auth stack
export type AuthStackParams = {
  Login: undefined;
  Signup: undefined;
};

// Main tab bar
export type MainTabParams = {
  Trips: undefined;
  Explore: undefined;
  Pinboard: undefined;
  Profile: undefined;
};

// Trip stack (inside tab)
export type TripStackParams = {
  Dashboard: undefined;
  TripDetail: { tripId: string; tripName: string };
  TripItinerary: { tripId: string };
  TripMap: { tripId: string };
  TripBudget: { tripId: string };
  TripBookings: { tripId: string };
  CreateTrip: undefined;
  PlaceSearch: { tripId: string; sectionId: string };
  PlaceDetail: { placeId: string; placeGoogleId?: string };
  InviteCollaborators: { tripId: string };
  AIAssistant: { tripId: string };
  TripExplore: { tripId: string };
};

export type AuthScreenProps<T extends keyof AuthStackParams> = NativeStackScreenProps<AuthStackParams, T>;
export type TripScreenProps<T extends keyof TripStackParams> = NativeStackScreenProps<TripStackParams, T>;
