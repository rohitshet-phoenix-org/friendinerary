import type { PlaceItem } from "./place";

export type SectionType = "day" | "list" | "ideas" | "checklist";

export interface Section {
  id: string;
  tripId: string;
  type: SectionType;
  name: string;
  date: string | null;
  color: string;
  icon: string | null;
  order: number;
  isCollapsed: boolean;
  placeItems: PlaceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionPayload {
  type: SectionType;
  name: string;
  date?: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface UpdateSectionPayload {
  name?: string;
  date?: string | null;
  color?: string;
  icon?: string | null;
  order?: number;
  isCollapsed?: boolean;
}

export interface ReorderSectionsPayload {
  orderedIds: string[];
}

export interface ReorderPlaceItemsPayload {
  orderedIds: string[];
  targetSectionId?: string;
}
