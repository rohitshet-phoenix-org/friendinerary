export type AuthProvider = "email" | "google" | "facebook";
export type SubscriptionTier = "free" | "pro";
export type OnboardingStatus = "basic" | "proficient" | "allstar";

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  usernameChangedAt: string | null;
  usernameChangeCount: number;
  profilePhoto: string | null;
  authProvider: AuthProvider;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: string | null;
  onboardingStatus: OnboardingStatus;
  onboardingStepsCompleted: string[];
  followingCount: number;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  trips: { id: string; name: string; coverPhotoUrl: string | null; startDate: string | null; endDate: string | null; destinations: string[]; placeCount: number }[];
  stories: { id: string; title: string; shareSlug: string; coverPhotoUrl: string | null; createdAt: string }[];
  visitedPlaces: VisitedPlaceEntry[];
  visitedPlacesCount: number;
  countriesCount: number;
  isFollowing?: boolean;
}

export interface VisitedPlaceEntry {
  id: string;
  name: string;
  country: string | null;
  lat: number;
  lng: number;
  visitedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface OAuthPayload {
  provider: "google" | "facebook";
  token: string;
}
