import { makeAutoObservable, runInAction } from "mobx";
import type { User, AuthTokens } from "@friendinerary/types";
import { api } from "../lib/api";
import type { RootStore } from "./RootStore";

export class AuthStore {
  user: User | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;
  initialized = false;
  loading = false;
  error: string | null = null;

  constructor(private root: RootStore) {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return this.user !== null && this.accessToken !== null;
  }

  get isPro() {
    return this.user?.subscriptionTier === "pro";
  }

  initialize() {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (token && refresh) {
      this.accessToken = token;
      this.refreshToken = refresh;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      this.fetchMe().finally(() => runInAction(() => (this.initialized = true)));
    } else {
      runInAction(() => (this.initialized = true));
    }
  }

  async fetchMe() {
    try {
      const { data } = await api.get<{ data: User }>("/auth/me");
      runInAction(() => {
        this.user = data.data;
      });
    } catch {
      this.logout();
    }
  }

  async login(email: string, password: string) {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.post<{ data: { user: User } & AuthTokens }>("/auth/login", { email, password });
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      runInAction(() => {
        this.user = data.data.user;
        this.loading = false;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.error = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Login failed";
        this.loading = false;
      });
      throw err;
    }
  }

  async signup(email: string, password: string, displayName: string) {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.post<{ data: { user: User } & AuthTokens }>("/auth/signup", { email, password, displayName });
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      runInAction(() => {
        this.user = data.data.user;
        this.loading = false;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.error = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Signup failed";
        this.loading = false;
      });
      throw err;
    }
  }

  async logout() {
    if (this.refreshToken) {
      api.post("/auth/logout", { refreshToken: this.refreshToken }).catch(() => null);
    }
    runInAction(() => {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
    });
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    this.root.trips.reset();
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  setFromOAuthCallback(token: string, refresh: string) {
    this.setTokens(token, refresh);
    this.fetchMe().finally(() => runInAction(() => (this.initialized = true)));
  }

  async updateProfile(updates: Partial<Pick<User, "displayName" | "profilePhoto">>) {
    const { data } = await api.put<{ data: User }>("/users/me", updates);
    runInAction(() => {
      this.user = data.data;
    });
  }
}
