import type { Place } from "./place";

export interface Guide {
  id: string;
  slug: string;
  title: string;
  destination: string;
  authorId: string | null;
  authorName: string;
  coverPhotoUrl: string | null;
  places: Place[];
  categories: string[];
  viewCount: number;
  likeCount: number;
  isUserGenerated: boolean;
  sourceName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuideSummary {
  id: string;
  slug: string;
  title: string;
  destination: string;
  authorName: string;
  coverPhotoUrl: string | null;
  placeCount: number;
  categories: string[];
  isUserGenerated: boolean;
}

export interface TripStory {
  id: string;
  tripId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  summary: string | null;
  coverPhotoUrl: string | null;
  photos: StoryPhoto[];
  visitedStops: Place[];
  shareSlug: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface StoryPhoto {
  id: string;
  url: string;
  caption: string | null;
  placeId: string | null;
}
