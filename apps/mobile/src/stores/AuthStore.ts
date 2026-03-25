import { makeAutoObservable, runInAction } from "mobx";
import { api, storage } from "../lib/api";
import type { User, LoginPayload, SignupPayload } from "@friendinerary/types";

export class AuthStore {
  user: User | null = null;
  initialized = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }

  get isAuthenticated() {
    return !!this.user;
  }

  get isPro() {
    return this.user?.subscription?.tier === "PRO";
  }

  async initialize() {
    const token = storage.getString("access_token");
    const userJson = storage.getString("user");
    if (token && userJson) {
      try {
        this.user = JSON.parse(userJson) as User;
        // Refresh from server
        const { data } = await api.get<{ data: User }>("/auth/me");
        runInAction(() => {
          this.user = data.data;
          storage.set("user", JSON.stringify(data.data));
        });
      } catch {
        this.user = null;
      }
    }
    runInAction(() => {
      this.initialized = true;
    });
  }

  async login(payload: LoginPayload) {
    this.loading = true;
    try {
      const { data } = await api.post<{
        data: { user: User; accessToken: string; refreshToken: string }
      }>("/auth/login", payload);
      this.setSession(data.data);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async signup(payload: SignupPayload) {
    this.loading = true;
    try {
      const { data } = await api.post<{
        data: { user: User; accessToken: string; refreshToken: string }
      }>("/auth/signup", payload);
      this.setSession(data.data);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  setSession(session: { user: User; accessToken: string; refreshToken: string }) {
    storage.set("access_token", session.accessToken);
    storage.set("refresh_token", session.refreshToken);
    storage.set("user", JSON.stringify(session.user));
    runInAction(() => {
      this.user = session.user;
    });
  }

  async logout() {
    try {
      const refresh = storage.getString("refresh_token");
      await api.post("/auth/logout", { refreshToken: refresh });
    } catch {
      // ignore
    }
    storage.delete("access_token");
    storage.delete("refresh_token");
    storage.delete("user");
    runInAction(() => {
      this.user = null;
    });
  }

  async updateProfile(updates: { displayName?: string }) {
    const { data } = await api.put<{ data: User }>("/users/profile", updates);
    runInAction(() => {
      this.user = data.data;
      storage.set("user", JSON.stringify(data.data));
    });
  }
}
