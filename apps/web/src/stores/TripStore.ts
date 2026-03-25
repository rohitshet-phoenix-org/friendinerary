import { makeAutoObservable, runInAction } from "mobx";
import type { Trip, TripSummary, Section, PlaceItem, CreateTripPayload } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class TripStore {
  trips: TripSummary[] = [];
  currentTrip: Trip | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  constructor(private root: RootStore) {
    makeAutoObservable(this);
  }

  reset() {
    this.trips = [];
    this.currentTrip = null;
  }

  // ─── Trip List ────────────────────────────────────────────────────────────

  async fetchTrips() {
    this.loading = true;
    try {
      const { data } = await api.get<{ data: TripSummary[] }>("/trips");
      runInAction(() => {
        this.trips = data.data;
        this.loading = false;
      });
    } catch {
      runInAction(() => (this.loading = false));
    }
  }

  async createTrip(payload: CreateTripPayload): Promise<Trip> {
    this.saving = true;
    try {
      const { data } = await api.post<{ data: Trip }>("/trips", payload);
      runInAction(() => {
        this.trips.unshift(data.data as unknown as TripSummary);
        this.saving = false;
      });
      return data.data;
    } catch {
      runInAction(() => (this.saving = false));
      throw new Error("Failed to create trip");
    }
  }

  async deleteTrip(tripId: string) {
    await api.delete(`/trips/${tripId}`);
    runInAction(() => {
      this.trips = this.trips.filter((t) => t.id !== tripId);
      if (this.currentTrip?.id === tripId) this.currentTrip = null;
    });
  }

  async duplicateTrip(tripId: string): Promise<Trip> {
    const { data } = await api.post<{ data: Trip }>(`/trips/${tripId}/duplicate`);
    runInAction(() => {
      this.trips.unshift(data.data as unknown as TripSummary);
    });
    return data.data;
  }

  // ─── Current Trip ─────────────────────────────────────────────────────────

  async loadTrip(tripId: string) {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.get<{ data: Trip }>(`/trips/${tripId}`);
      runInAction(() => {
        this.currentTrip = data.data;
        this.loading = false;
      });
    } catch {
      runInAction(() => {
        this.error = "Failed to load trip";
        this.loading = false;
      });
    }
  }

  async updateTrip(tripId: string, updates: Partial<Trip>) {
    const { data } = await api.put<{ data: Trip }>(`/trips/${tripId}`, updates);
    runInAction(() => {
      if (this.currentTrip?.id === tripId) {
        Object.assign(this.currentTrip, data.data);
      }
    });
  }

  // ─── Sections ─────────────────────────────────────────────────────────────

  async createSection(tripId: string, payload: Partial<Section>) {
    const { data } = await api.post<{ data: Section }>(`/trips/${tripId}/sections`, payload);
    runInAction(() => {
      if (this.currentTrip) {
        this.currentTrip.sections.push(data.data);
      }
    });
    return data.data;
  }

  async updateSection(tripId: string, sectionId: string, updates: Partial<Section>) {
    const { data } = await api.put<{ data: Section }>(`/trips/${tripId}/sections/${sectionId}`, updates);
    runInAction(() => {
      if (this.currentTrip) {
        const idx = this.currentTrip.sections.findIndex((s) => s.id === sectionId);
        if (idx !== -1) this.currentTrip.sections[idx] = data.data;
      }
    });
  }

  async deleteSection(tripId: string, sectionId: string) {
    await api.delete(`/trips/${tripId}/sections/${sectionId}`);
    runInAction(() => {
      if (this.currentTrip) {
        this.currentTrip.sections = this.currentTrip.sections.filter((s) => s.id !== sectionId);
      }
    });
  }

  async reorderSections(tripId: string, orderedIds: string[]) {
    // Optimistic update
    runInAction(() => {
      if (this.currentTrip) {
        const sectionMap = new Map(this.currentTrip.sections.map((s) => [s.id, s]));
        this.currentTrip.sections = orderedIds
          .map((id) => sectionMap.get(id))
          .filter(Boolean) as Section[];
      }
    });
    await api.post(`/trips/${tripId}/sections/reorder`, { orderedIds });
  }

  // ─── Place Items ──────────────────────────────────────────────────────────

  async addPlaceToSection(tripId: string, sectionId: string, placeData: Record<string, unknown>) {
    const { data } = await api.post<{ data: PlaceItem }>(
      `/trips/${tripId}/sections/${sectionId}/places`,
      placeData
    );
    runInAction(() => {
      const section = this.currentTrip?.sections.find((s) => s.id === sectionId);
      if (section) section.placeItems.push(data.data);
    });
    return data.data;
  }

  async updatePlaceItem(tripId: string, sectionId: string, itemId: string, updates: Partial<PlaceItem>) {
    const { data } = await api.put<{ data: PlaceItem }>(
      `/trips/${tripId}/sections/${sectionId}/places/${itemId}`,
      updates
    );
    runInAction(() => {
      const section = this.currentTrip?.sections.find((s) => s.id === sectionId);
      if (section) {
        const idx = section.placeItems.findIndex((p) => p.id === itemId);
        if (idx !== -1) section.placeItems[idx] = data.data;
      }
    });
  }

  async deletePlaceItem(tripId: string, sectionId: string, itemId: string) {
    await api.delete(`/trips/${tripId}/sections/${sectionId}/places/${itemId}`);
    runInAction(() => {
      const section = this.currentTrip?.sections.find((s) => s.id === sectionId);
      if (section) {
        section.placeItems = section.placeItems.filter((p) => p.id !== itemId);
      }
    });
  }

  async reorderPlaceItems(tripId: string, sectionId: string, orderedIds: string[], targetSectionId?: string) {
    runInAction(() => {
      if (!this.currentTrip) return;
      const fromSection = this.currentTrip.sections.find((s) => s.id === sectionId);
      if (!fromSection) return;

      if (!targetSectionId || targetSectionId === sectionId) {
        const itemMap = new Map(fromSection.placeItems.map((p) => [p.id, p]));
        fromSection.placeItems = orderedIds.map((id) => itemMap.get(id)).filter(Boolean) as PlaceItem[];
      } else {
        const toSection = this.currentTrip.sections.find((s) => s.id === targetSectionId);
        if (!toSection) return;
        const movedItems = orderedIds.map((id) => fromSection.placeItems.find((p) => p.id === id)).filter(Boolean) as PlaceItem[];
        fromSection.placeItems = fromSection.placeItems.filter((p) => !orderedIds.includes(p.id));
        toSection.placeItems.push(...movedItems);
      }
    });

    await api.post(`/trips/${tripId}/sections/${sectionId}/places/reorder`, {
      orderedIds,
      targetSectionId,
    });
  }

  // ─── Socket updates (called by CollaborationStore) ─────────────────────────

  applySocketEvent(event: string, payload: unknown) {
    runInAction(() => {
      if (!this.currentTrip) return;
      const p = payload as Record<string, unknown>;

      switch (event) {
        case "section_created":
          if (!this.currentTrip.sections.find((s) => s.id === (p as Section).id)) {
            this.currentTrip.sections.push(p as Section);
          }
          break;
        case "section_updated": {
          const idx = this.currentTrip.sections.findIndex((s) => s.id === (p as Section).id);
          if (idx !== -1) this.currentTrip.sections[idx] = p as Section;
          break;
        }
        case "section_deleted":
          this.currentTrip.sections = this.currentTrip.sections.filter(
            (s) => s.id !== (p as { sectionId: string }).sectionId
          );
          break;
        case "place_item_added": {
          const pi = p as PlaceItem;
          const section = this.currentTrip.sections.find((s) => s.id === pi.sectionId);
          if (section && !section.placeItems.find((i) => i.id === pi.id)) {
            section.placeItems.push(pi);
          }
          break;
        }
        case "place_item_updated": {
          const pi = p as PlaceItem;
          for (const section of this.currentTrip.sections) {
            const idx = section.placeItems.findIndex((i) => i.id === pi.id);
            if (idx !== -1) { section.placeItems[idx] = pi; break; }
          }
          break;
        }
        case "place_item_deleted": {
          const { itemId } = p as { itemId: string };
          for (const section of this.currentTrip.sections) {
            section.placeItems = section.placeItems.filter((i) => i.id !== itemId);
          }
          break;
        }
      }
    });
  }
}
