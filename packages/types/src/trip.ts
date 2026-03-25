import type { Section } from "./section";
import type { Reservation } from "./reservation";
import type { Expense, Budget } from "./expense";
import type { Collaborator } from "./collaboration";

export type TripPrivacy = "public" | "friends" | "private";
export type TripStatus = "planning" | "active" | "completed";

export interface Trip {
  id: string;
  slug: string;
  name: string;
  coverPhotoUrl: string | null;
  ownerId: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  privacyLevel: TripPrivacy;
  status: TripStatus;
  sections: Section[];
  reservations: Reservation[];
  expenses: Expense[];
  budget: Budget | null;
  collaborators: Collaborator[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TripSummary {
  id: string;
  slug: string;
  name: string;
  coverPhotoUrl: string | null;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  privacyLevel: TripPrivacy;
  status: TripStatus;
  collaboratorCount: number;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  tripId: string;
  filename: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  linkedReservationId: string | null;
  linkedPlaceIds: string[];
  uploadedByUserId: string;
  createdAt: string;
}

export interface CreateTripPayload {
  name: string;
  destinations: string[];
  startDate?: string;
  endDate?: string;
  privacyLevel?: TripPrivacy;
  coverPhotoUrl?: string;
}

export interface UpdateTripPayload {
  name?: string;
  destinations?: string[];
  startDate?: string | null;
  endDate?: string | null;
  privacyLevel?: TripPrivacy;
  coverPhotoUrl?: string | null;
  status?: TripStatus;
}
