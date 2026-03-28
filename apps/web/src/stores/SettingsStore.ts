import { makeAutoObservable } from "mobx";
import type { RootStore } from "./RootStore";

export type DistanceUnit = "metric" | "imperial";
export type TemperatureUnit = "celsius" | "fahrenheit";
export type DateFormatType = "mdy" | "dmy";
export type TimeFormatType = "12h" | "24h";
export type WeekStart = "sunday" | "monday";
export type MapType = "standard" | "satellite" | "terrain";
export type TransportMode = "driving" | "walking" | "transit" | "bicycling";
export type TripVisibility = "private" | "friends" | "public";
export type TravelStyle = "budget" | "midrange" | "luxury";
export type StartPage = "dashboard" | "last-trip" | "explore";

export interface NotificationPrefs {
  tripReminders: boolean;
  activityReminders: boolean;
  collaborationUpdates: boolean;
  priceAlerts: boolean;
  weatherAlerts: boolean;
  productUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface TravelPrefs {
  travelStyle: TravelStyle;
  dietaryRestrictions: string[];
  activityPreferences: string[];
  accessibilityNeeds: string;
  accommodationTypes: string[];
  defaultTravelers: number;
}

const STORAGE_KEY = "friendinerary_settings";

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  tripReminders: true,
  activityReminders: true,
  collaborationUpdates: true,
  priceAlerts: true,
  weatherAlerts: false,
  productUpdates: true,
  emailNotifications: true,
  pushNotifications: true,
};

const DEFAULT_TRAVEL_PREFS: TravelPrefs = {
  travelStyle: "midrange",
  dietaryRestrictions: [],
  activityPreferences: [],
  accessibilityNeeds: "",
  accommodationTypes: [],
  defaultTravelers: 1,
};

export class SettingsStore {
  // Preferences
  distanceUnit: DistanceUnit = "metric";
  currency: string = "USD";
  temperatureUnit: TemperatureUnit = "celsius";
  dateFormat: DateFormatType = "mdy";
  timeFormat: TimeFormatType = "12h";
  weekStart: WeekStart = "sunday";
  defaultMapType: MapType = "standard";
  defaultTransportMode: TransportMode = "driving";
  defaultTripVisibility: TripVisibility = "private";
  startPage: StartPage = "dashboard";
  language: string = "en";

  // Notifications
  notifications: NotificationPrefs = { ...DEFAULT_NOTIFICATIONS };

  // Travel preferences
  travelPrefs: TravelPrefs = { ...DEFAULT_TRAVEL_PREFS };

  // Connected accounts
  connectedGoogle: boolean = false;
  connectedFacebook: boolean = false;
  connectedGmail: boolean = false;
  connectedCalendar: boolean = false;

  constructor(private root: RootStore) {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.distanceUnit) this.distanceUnit = saved.distanceUnit;
      if (saved.currency) this.currency = saved.currency;
      if (saved.temperatureUnit) this.temperatureUnit = saved.temperatureUnit;
      if (saved.dateFormat) this.dateFormat = saved.dateFormat;
      if (saved.timeFormat) this.timeFormat = saved.timeFormat;
      if (saved.weekStart) this.weekStart = saved.weekStart;
      if (saved.defaultMapType) this.defaultMapType = saved.defaultMapType;
      if (saved.defaultTransportMode) this.defaultTransportMode = saved.defaultTransportMode;
      if (saved.defaultTripVisibility) this.defaultTripVisibility = saved.defaultTripVisibility;
      if (saved.startPage) this.startPage = saved.startPage;
      if (saved.language) this.language = saved.language;
      if (saved.notifications) this.notifications = { ...DEFAULT_NOTIFICATIONS, ...saved.notifications };
      if (saved.travelPrefs) this.travelPrefs = { ...DEFAULT_TRAVEL_PREFS, ...saved.travelPrefs };
      if (saved.connectedGoogle !== undefined) this.connectedGoogle = saved.connectedGoogle;
      if (saved.connectedFacebook !== undefined) this.connectedFacebook = saved.connectedFacebook;
      if (saved.connectedGmail !== undefined) this.connectedGmail = saved.connectedGmail;
      if (saved.connectedCalendar !== undefined) this.connectedCalendar = saved.connectedCalendar;
    } catch {
      // ignore corrupt storage
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      distanceUnit: this.distanceUnit,
      currency: this.currency,
      temperatureUnit: this.temperatureUnit,
      dateFormat: this.dateFormat,
      timeFormat: this.timeFormat,
      weekStart: this.weekStart,
      defaultMapType: this.defaultMapType,
      defaultTransportMode: this.defaultTransportMode,
      defaultTripVisibility: this.defaultTripVisibility,
      startPage: this.startPage,
      language: this.language,
      notifications: this.notifications,
      travelPrefs: this.travelPrefs,
      connectedGoogle: this.connectedGoogle,
      connectedFacebook: this.connectedFacebook,
      connectedGmail: this.connectedGmail,
      connectedCalendar: this.connectedCalendar,
    }));
  }

  // Setters — each one persists
  setDistanceUnit(unit: DistanceUnit) { this.distanceUnit = unit; this.persist(); }
  setCurrency(currency: string) { this.currency = currency; this.persist(); }
  setTemperatureUnit(unit: TemperatureUnit) { this.temperatureUnit = unit; this.persist(); }
  setDateFormat(fmt: DateFormatType) { this.dateFormat = fmt; this.persist(); }
  setTimeFormat(fmt: TimeFormatType) { this.timeFormat = fmt; this.persist(); }
  setWeekStart(day: WeekStart) { this.weekStart = day; this.persist(); }
  setDefaultMapType(type: MapType) { this.defaultMapType = type; this.persist(); }
  setDefaultTransportMode(mode: TransportMode) { this.defaultTransportMode = mode; this.persist(); }
  setDefaultTripVisibility(vis: TripVisibility) { this.defaultTripVisibility = vis; this.persist(); }
  setStartPage(page: StartPage) { this.startPage = page; this.persist(); }
  setLanguage(lang: string) { this.language = lang; this.persist(); }

  setNotification(key: keyof NotificationPrefs, value: boolean) {
    this.notifications = { ...this.notifications, [key]: value };
    this.persist();
  }

  setTravelPref<K extends keyof TravelPrefs>(key: K, value: TravelPrefs[K]) {
    this.travelPrefs = { ...this.travelPrefs, [key]: value };
    this.persist();
  }

  toggleDietaryRestriction(item: string) {
    const list = [...this.travelPrefs.dietaryRestrictions];
    const idx = list.indexOf(item);
    if (idx >= 0) list.splice(idx, 1); else list.push(item);
    this.setTravelPref("dietaryRestrictions", list);
  }

  toggleActivityPreference(item: string) {
    const list = [...this.travelPrefs.activityPreferences];
    const idx = list.indexOf(item);
    if (idx >= 0) list.splice(idx, 1); else list.push(item);
    this.setTravelPref("activityPreferences", list);
  }

  toggleAccommodationType(item: string) {
    const list = [...this.travelPrefs.accommodationTypes];
    const idx = list.indexOf(item);
    if (idx >= 0) list.splice(idx, 1); else list.push(item);
    this.setTravelPref("accommodationTypes", list);
  }

  setConnectedGoogle(v: boolean) { this.connectedGoogle = v; this.persist(); }
  setConnectedFacebook(v: boolean) { this.connectedFacebook = v; this.persist(); }
  setConnectedGmail(v: boolean) { this.connectedGmail = v; this.persist(); }
  setConnectedCalendar(v: boolean) { this.connectedCalendar = v; this.persist(); }

  // Helpers for formatting throughout the app
  formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    if (this.dateFormat === "dmy") return `${day} ${month} ${year}`;
    return `${month} ${day}, ${year}`;
  }

  formatShortDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = d.getDate();
    if (this.dateFormat === "dmy") return `${day} ${month}`;
    return `${month} ${day}`;
  }

  formatTime(time: string): string {
    if (this.timeFormat === "24h") return time;
    // Convert HH:MM to 12h format
    const parts = time.split(":").map(Number);
    const h = parts[0];
    const m = parts[1];
    if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return time;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  formatDistance(km: number): string {
    if (this.distanceUnit === "imperial") {
      return `${(km * 0.621371).toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  }

  formatTemperature(celsius: number): string {
    if (this.temperatureUnit === "fahrenheit") {
      return `${Math.round(celsius * 9 / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  get currencySymbol(): string {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹",
      AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥", KRW: "₩",
      SGD: "S$", THB: "฿", MYR: "RM", PHP: "₱", IDR: "Rp",
      NZD: "NZ$", SEK: "kr", NOK: "kr", DKK: "kr", BRL: "R$",
      MXN: "MX$", ZAR: "R", AED: "AED", HKD: "HK$", TWD: "NT$",
    };
    return symbols[this.currency] ?? this.currency;
  }

  formatCurrency(amount: number): string {
    return `${this.currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}
