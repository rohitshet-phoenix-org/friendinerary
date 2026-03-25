import { makeAutoObservable, runInAction } from "mobx";
import type { Guide } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class ExploreStore {
  guides: Guide[] = [];
  currentGuide: Guide | null = null;
  destination = "";
  category = "";
  loading = false;
  total = 0;
  page = 1;

  constructor(_root: RootStore) {
    makeAutoObservable(this);
  }

  setDestination(d: string) {
    this.destination = d;
    this.page = 1;
    this.fetchGuides();
  }

  setCategory(c: string) {
    this.category = c;
    this.page = 1;
    this.fetchGuides();
  }

  async fetchGuides() {
    this.loading = true;
    try {
      const params = new URLSearchParams({
        ...(this.destination && { destination: this.destination }),
        ...(this.category && { category: this.category }),
        page: String(this.page),
      });
      const { data } = await api.get<{ data: { guides: Guide[]; total: number } }>(`/guides?${params}`);
      runInAction(() => {
        this.guides = data.data.guides;
        this.total = data.data.total;
        this.loading = false;
      });
    } catch {
      runInAction(() => (this.loading = false));
    }
  }

  async loadGuide(guideId: string) {
    this.loading = true;
    try {
      const { data } = await api.get<{ data: Guide }>(`/guides/${guideId}`);
      runInAction(() => {
        this.currentGuide = data.data;
        this.loading = false;
      });
    } catch {
      runInAction(() => (this.loading = false));
    }
  }
}
