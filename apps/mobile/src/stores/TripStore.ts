import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../lib/api";
import type { Trip, TripSummary, CreateTripPayload } from "@friendinerary/types";

export class TripStore {
  trips: TripSummary[] = [];
  currentTrip: Trip | null = null;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchTrips() {
    this.loading = true;
    try {
      const { data } = await api.get<{ data: TripSummary[] }>("/trips");
      runInAction(() => {
        this.trips = data.data;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadTrip(tripId: string) {
    this.loading = true;
    try {
      const { data } = await api.get<{ data: Trip }>(`/trips/${tripId}`);
      runInAction(() => {
        this.currentTrip = data.data;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createTrip(payload: CreateTripPayload) {
    const { data } = await api.post<{ data: TripSummary }>("/trips", payload);
    runInAction(() => {
      this.trips.unshift(data.data);
    });
    return data.data;
  }

  async deleteTrip(tripId: string) {
    await api.delete(`/trips/${tripId}`);
    runInAction(() => {
      this.trips = this.trips.filter((t) => t.id !== tripId);
      if (this.currentTrip?.id === tripId) this.currentTrip = null;
    });
  }

  clearCurrentTrip() {
    this.currentTrip = null;
  }
}
