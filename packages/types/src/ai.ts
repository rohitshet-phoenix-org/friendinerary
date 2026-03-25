import type { Place } from "./place";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  suggestedPlaces: Place[];
  timestamp: string;
}

export interface ChatThread {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  content: string;
  threadId?: string;
}

export interface GenerateItineraryPayload {
  destination: string;
  durationDays: number;
  preferences: string[];
  budget?: "budget" | "mid-range" | "luxury";
  travelStyle?: string;
}

export interface GeneratedItinerary {
  days: GeneratedDay[];
  notes: string;
}

export interface GeneratedDay {
  dayNumber: number;
  theme: string;
  places: {
    name: string;
    description: string;
    category: string;
    suggestedDurationMinutes: number;
  }[];
}
