import { makeAutoObservable, runInAction } from "mobx";
import type { ChatThread, ChatMessage } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class AIStore {
  threads: ChatThread[] = [];
  currentThreadId: string | null = null;
  messages: ChatMessage[] = [];
  loading = false;
  sending = false;
  suggestedPlaces: object[] = [];

  constructor(private root: RootStore) {
    makeAutoObservable(this);
  }

  get currentThread() {
    return this.threads.find((t) => t.id === this.currentThreadId) ?? null;
  }

  get isPro() {
    return this.root.auth.isPro;
  }

  async loadThreads(tripId: string) {
    this.loading = true;
    try {
      const { data } = await api.get<{ data: ChatThread[] }>(`/trips/${tripId}/assistant/threads`);
      runInAction(() => {
        this.threads = data.data;
        this.loading = false;
        if (this.threads.length > 0 && !this.currentThreadId) {
          this.currentThreadId = this.threads[0]!.id;
          this.messages = this.threads[0]!.messages ?? [];
        }
      });
    } catch {
      runInAction(() => (this.loading = false));
    }
  }

  async newThread(tripId: string) {
    const { data } = await api.post<{ data: ChatThread }>(`/trips/${tripId}/assistant/threads`);
    runInAction(() => {
      this.threads.unshift(data.data);
      this.currentThreadId = data.data.id;
      this.messages = [];
    });
  }

  async sendMessage(tripId: string, content: string) {
    this.sending = true;
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      suggestedPlaces: [],
      timestamp: new Date().toISOString(),
    };
    runInAction(() => {
      this.messages.push(optimisticMsg);
    });

    try {
      const travelPrefs = this.root.settings.travelPrefs;
      const { data } = await api.post<{
        data: { threadId: string; message: ChatMessage; suggestedPlaces: object[] };
      }>(`/trips/${tripId}/assistant/chat`, {
        content,
        threadId: this.currentThreadId,
        userPreferences: {
          travelStyle: travelPrefs.travelStyle,
          dietaryRestrictions: travelPrefs.dietaryRestrictions,
          activityPreferences: travelPrefs.activityPreferences,
          accessibilityNeeds: travelPrefs.accessibilityNeeds,
          accommodationTypes: travelPrefs.accommodationTypes,
          currency: this.root.settings.currency,
          distanceUnit: this.root.settings.distanceUnit,
        },
      });

      runInAction(() => {
        // Remove optimistic message, add real ones
        this.messages = this.messages.filter((m) => m.id !== optimisticMsg.id);
        const userMsg = { ...optimisticMsg, id: `user-${Date.now()}` };
        this.messages.push(userMsg, data.data.message);
        this.suggestedPlaces = data.data.suggestedPlaces;
        if (!this.currentThreadId) this.currentThreadId = data.data.threadId;
        this.sending = false;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.messages = this.messages.filter((m) => m.id !== optimisticMsg.id);
        this.sending = false;
      });
      throw err;
    }
  }

  async generateItinerary(tripId: string, payload: {
    destination: string;
    durationDays: number;
    preferences?: string[];
    budget?: "budget" | "mid-range" | "luxury";
  }) {
    this.loading = true;
    try {
      const { data } = await api.post(`/trips/${tripId}/assistant/generate-itinerary`, payload);
      runInAction(() => (this.loading = false));
      return data.data;
    } catch {
      runInAction(() => (this.loading = false));
      throw new Error("Failed to generate itinerary");
    }
  }

  clearSuggestedPlaces() {
    this.suggestedPlaces = [];
  }
}
