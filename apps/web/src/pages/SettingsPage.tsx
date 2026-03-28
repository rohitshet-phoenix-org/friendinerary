import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import AppLayout from "../components/ui/AppLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import {
  User, CreditCard, Settings, Crown, Bell, Shield, Globe2, Plane,
  Link2, Download, Eye, EyeOff, MapPin, Ruler, Thermometer, Clock,
  Calendar, Map, Car, Lock, Trash2, Languages, Monitor, Mail,
  Utensils, Mountain, Building, Users, ChevronRight,
} from "lucide-react";
import type {
  DistanceUnit, TemperatureUnit, DateFormatType, TimeFormatType,
  WeekStart, MapType, TransportMode, TripVisibility, TravelStyle, StartPage,
} from "../stores/SettingsStore";

type SettingsSection = "profile" | "preferences" | "notifications" | "privacy" | "connections" | "travel" | "subscription" | "data";

const SECTIONS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "preferences", label: "Preferences", icon: <Settings className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "privacy", label: "Privacy & Security", icon: <Shield className="w-4 h-4" /> },
  { id: "connections", label: "Connected Accounts", icon: <Link2 className="w-4 h-4" /> },
  { id: "travel", label: "Travel Preferences", icon: <Plane className="w-4 h-4" /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="w-4 h-4" /> },
  { id: "data", label: "Data & Export", icon: <Download className="w-4 h-4" /> },
];

const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF", "CNY", "KRW",
  "SGD", "THB", "MYR", "PHP", "IDR", "NZD", "SEK", "NOK", "DKK", "BRL",
  "MXN", "ZAR", "AED", "HKD", "TWD",
];

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Lactose-free", "Nut allergy", "Seafood allergy"];
const ACTIVITY_OPTIONS = ["Adventure", "Culture & History", "Food & Dining", "Nightlife", "Nature & Outdoors", "Relaxation & Spa", "Shopping", "Photography", "Water Sports", "Winter Sports"];
const ACCOMMODATION_OPTIONS = ["Hotels", "Hostels", "Airbnb / Vacation Rentals", "Boutique Hotels", "Resorts", "Camping", "Bed & Breakfast"];

const SettingsPage = observer(() => {
  const { auth, settings } = useStore();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection: SettingsSection =
    sectionParam === "security" ? "privacy" :
    SECTIONS.some((s) => s.id === sectionParam) ? sectionParam as SettingsSection : "profile";
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [displayName, setDisplayName] = useState(auth.user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await auth.updateProfile({ displayName });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data } = await api.get<{ data: { portalUrl: string } }>("/subscriptions/portal");
      window.location.href = data.data.portalUrl;
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  const handleExportData = async () => {
    try {
      const { data } = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `friendinerary-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    try {
      await api.delete("/users/me");
      auth.logout();
      toast.success("Account scheduled for deletion");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 text-sm">Manage your account, preferences, and app configuration</p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <nav className="w-56 flex-shrink-0 space-y-0.5">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? "bg-orange-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* ────── PROFILE ────── */}
            {activeSection === "profile" && (
              <SettingsCard title="Profile" subtitle="Your public profile information" icon={<User className="w-5 h-5 text-blue-500" />} color="bg-blue-50 dark:bg-blue-900/20">
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    {auth.user?.profilePhoto ? (
                      <img src={auth.user.profilePhoto} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">
                        {auth.user?.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{auth.user?.displayName}</p>
                      <p className="text-xs text-gray-400">{auth.user?.email}</p>
                    </div>
                  </div>

                  <FieldGroup label="Display name">
                    <SettingsInput value={displayName} onChange={setDisplayName} placeholder="Your name" />
                  </FieldGroup>

                  <FieldGroup label="Email">
                    <SettingsInput value={auth.user?.email ?? ""} disabled placeholder="Email" />
                    <p className="text-xs text-gray-400 mt-1">Contact support to change your email address</p>
                  </FieldGroup>

                  <FieldGroup label="Home base">
                    <SettingsInput placeholder="e.g. San Francisco, CA" />
                    <p className="text-xs text-gray-400 mt-1">Displayed on your profile</p>
                  </FieldGroup>

                  <SaveButton saving={saving} />
                </form>

                {/* Change password */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" /> Change password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <FieldGroup label="Current password">
                      <PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                    </FieldGroup>
                    <FieldGroup label="New password">
                      <PasswordInput value={newPassword} onChange={setNewPassword} show={showPassword} toggle={() => setShowPassword(!showPassword)} placeholder="At least 8 characters" />
                    </FieldGroup>
                    <FieldGroup label="Confirm new password">
                      <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                    </FieldGroup>
                    <button type="submit" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
                      Update password
                    </button>
                  </form>
                </div>
              </SettingsCard>
            )}

            {/* ────── PREFERENCES ────── */}
            {activeSection === "preferences" && (
              <SettingsCard title="Preferences" subtitle="Customize how the app works for you" icon={<Settings className="w-5 h-5 text-purple-500" />} color="bg-purple-50 dark:bg-purple-900/20">
                <div className="space-y-6">
                  <SettingsRow label="Distance units" icon={<Ruler className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "metric", label: "Metric (km)" }, { value: "imperial", label: "Imperial (mi)" }]}
                      value={settings.distanceUnit}
                      onChange={(v) => settings.setDistanceUnit(v as DistanceUnit)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Default currency" icon={<CreditCard className="w-4 h-4" />}>
                    <SelectInput value={settings.currency} onChange={(v) => settings.setCurrency(v)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                  </SettingsRow>

                  <SettingsRow label="Temperature" icon={<Thermometer className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "celsius", label: "°C" }, { value: "fahrenheit", label: "°F" }]}
                      value={settings.temperatureUnit}
                      onChange={(v) => settings.setTemperatureUnit(v as TemperatureUnit)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Date format" icon={<Calendar className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "mdy", label: "Jan 15, 2026" }, { value: "dmy", label: "15 Jan 2026" }]}
                      value={settings.dateFormat}
                      onChange={(v) => settings.setDateFormat(v as DateFormatType)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Time format" icon={<Clock className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "12h", label: "12-hour" }, { value: "24h", label: "24-hour" }]}
                      value={settings.timeFormat}
                      onChange={(v) => settings.setTimeFormat(v as TimeFormatType)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Week starts on" icon={<Calendar className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "sunday", label: "Sunday" }, { value: "monday", label: "Monday" }]}
                      value={settings.weekStart}
                      onChange={(v) => settings.setWeekStart(v as WeekStart)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Default map type" icon={<Map className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[{ value: "standard", label: "Standard" }, { value: "satellite", label: "Satellite" }, { value: "terrain", label: "Terrain" }]}
                      value={settings.defaultMapType}
                      onChange={(v) => settings.setDefaultMapType(v as MapType)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Default transport" icon={<Car className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[
                        { value: "driving", label: "Drive" },
                        { value: "walking", label: "Walk" },
                        { value: "transit", label: "Transit" },
                        { value: "bicycling", label: "Bike" },
                      ]}
                      value={settings.defaultTransportMode}
                      onChange={(v) => settings.setDefaultTransportMode(v as TransportMode)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Start page" icon={<Monitor className="w-4 h-4" />}>
                    <SelectInput
                      value={settings.startPage}
                      onChange={(v) => settings.setStartPage(v as StartPage)}
                      options={[
                        { value: "dashboard", label: "Dashboard" },
                        { value: "last-trip", label: "Last opened trip" },
                        { value: "explore", label: "Explore" },
                      ]}
                    />
                  </SettingsRow>

                  <SettingsRow label="Language" icon={<Languages className="w-4 h-4" />}>
                    <SelectInput
                      value={settings.language}
                      onChange={(v) => settings.setLanguage(v)}
                      options={[
                        { value: "en", label: "English" },
                        { value: "es", label: "Español (coming soon)" },
                        { value: "fr", label: "Français (coming soon)" },
                        { value: "de", label: "Deutsch (coming soon)" },
                        { value: "ja", label: "日本語 (coming soon)" },
                      ]}
                    />
                  </SettingsRow>
                </div>
              </SettingsCard>
            )}

            {/* ────── NOTIFICATIONS ────── */}
            {activeSection === "notifications" && (
              <SettingsCard title="Notifications" subtitle="Choose what you want to be notified about" icon={<Bell className="w-5 h-5 text-amber-500" />} color="bg-amber-50 dark:bg-amber-900/20">
                <div className="space-y-1">
                  <ToggleRow label="Trip departure reminders" desc="Get reminded 24h and 12h before your trip" checked={settings.notifications.tripReminders} onChange={(v) => settings.setNotification("tripReminders", v)} />
                  <ToggleRow label="Activity reminders" desc="Notifications when it's time to leave for the next stop" checked={settings.notifications.activityReminders} onChange={(v) => settings.setNotification("activityReminders", v)} />
                  <ToggleRow label="Collaboration updates" desc="When someone edits a shared trip" checked={settings.notifications.collaborationUpdates} onChange={(v) => settings.setNotification("collaborationUpdates", v)} />
                  <ToggleRow label="Price drop alerts" desc="Hotel and flight price changes" checked={settings.notifications.priceAlerts} onChange={(v) => settings.setNotification("priceAlerts", v)} />
                  <ToggleRow label="Weather alerts" desc="Severe weather warnings for your destinations" checked={settings.notifications.weatherAlerts} onChange={(v) => settings.setNotification("weatherAlerts", v)} />
                  <ToggleRow label="Product updates" desc="New features and improvements" checked={settings.notifications.productUpdates} onChange={(v) => settings.setNotification("productUpdates", v)} />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Notification channels</h3>
                  <div className="space-y-1">
                    <ToggleRow label="Email notifications" desc="Receive notifications via email" checked={settings.notifications.emailNotifications} onChange={(v) => settings.setNotification("emailNotifications", v)} />
                    <ToggleRow label="Push notifications" desc="Browser and mobile push notifications" checked={settings.notifications.pushNotifications} onChange={(v) => settings.setNotification("pushNotifications", v)} />
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* ────── PRIVACY & SECURITY ────── */}
            {activeSection === "privacy" && (
              <SettingsCard title="Privacy & Security" subtitle="Control your data and account security" icon={<Shield className="w-5 h-5 text-emerald-500" />} color="bg-emerald-50 dark:bg-emerald-900/20">
                <div className="space-y-6">
                  <SettingsRow label="Default trip visibility" icon={<Globe2 className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[
                        { value: "private", label: "Private" },
                        { value: "friends", label: "Friends" },
                        { value: "public", label: "Public" },
                      ]}
                      value={settings.defaultTripVisibility}
                      onChange={(v) => settings.setDefaultTripVisibility(v as TripVisibility)}
                    />
                  </SettingsRow>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" /> Two-factor authentication
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">Add an extra layer of security to your account</p>
                    <button className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      Enable 2FA <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-500" /> Active sessions
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">Manage devices where you're currently logged in</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Current session</p>
                          <p className="text-xs text-gray-400">This device · Active now</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* ────── CONNECTED ACCOUNTS ────── */}
            {activeSection === "connections" && (
              <SettingsCard title="Connected Accounts" subtitle="Link external services to enhance your experience" icon={<Link2 className="w-5 h-5 text-indigo-500" />} color="bg-indigo-50 dark:bg-indigo-900/20">
                <div className="space-y-3">
                  <ConnectionRow
                    name="Google"
                    desc="Sign in and sync with Google services"
                    connected={settings.connectedGoogle}
                    onToggle={() => settings.setConnectedGoogle(!settings.connectedGoogle)}
                    icon={<img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />}
                  />
                  <ConnectionRow
                    name="Facebook"
                    desc="Sign in with Facebook"
                    connected={settings.connectedFacebook}
                    onToggle={() => settings.setConnectedFacebook(!settings.connectedFacebook)}
                    icon={<div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">f</div>}
                  />
                  <ConnectionRow
                    name="Gmail Import"
                    desc="Auto-import flight & hotel reservations from email"
                    connected={settings.connectedGmail}
                    onToggle={() => settings.setConnectedGmail(!settings.connectedGmail)}
                    icon={<Mail className="w-5 h-5 text-red-500" />}
                  />
                  <ConnectionRow
                    name="Google Calendar"
                    desc="Sync itinerary items to your calendar"
                    connected={settings.connectedCalendar}
                    onToggle={() => settings.setConnectedCalendar(!settings.connectedCalendar)}
                    icon={<Calendar className="w-5 h-5 text-blue-500" />}
                  />
                </div>
              </SettingsCard>
            )}

            {/* ────── TRAVEL PREFERENCES ────── */}
            {activeSection === "travel" && (
              <SettingsCard title="Travel Preferences" subtitle="Help our AI give you better recommendations" icon={<Plane className="w-5 h-5 text-rose-500" />} color="bg-rose-50 dark:bg-rose-900/20">
                <div className="space-y-6">
                  <SettingsRow label="Travel style" icon={<MapPin className="w-4 h-4" />}>
                    <SegmentedControl
                      options={[
                        { value: "budget", label: "Budget" },
                        { value: "midrange", label: "Mid-range" },
                        { value: "luxury", label: "Luxury" },
                      ]}
                      value={settings.travelPrefs.travelStyle}
                      onChange={(v) => settings.setTravelPref("travelStyle", v as TravelStyle)}
                    />
                  </SettingsRow>

                  <SettingsRow label="Default travelers" icon={<Users className="w-4 h-4" />}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => settings.setTravelPref("defaultTravelers", Math.max(1, settings.travelPrefs.defaultTravelers - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-bold transition-colors"
                      >-</button>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">{settings.travelPrefs.defaultTravelers}</span>
                      <button
                        onClick={() => settings.setTravelPref("defaultTravelers", settings.travelPrefs.defaultTravelers + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center font-bold transition-colors"
                      >+</button>
                    </div>
                  </SettingsRow>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Utensils className="w-4 h-4 text-gray-400" /> Dietary restrictions
                    </label>
                    <ChipSelector options={DIETARY_OPTIONS} selected={settings.travelPrefs.dietaryRestrictions} onToggle={(v) => settings.toggleDietaryRestriction(v)} />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Mountain className="w-4 h-4 text-gray-400" /> Activity preferences
                    </label>
                    <ChipSelector options={ACTIVITY_OPTIONS} selected={settings.travelPrefs.activityPreferences} onToggle={(v) => settings.toggleActivityPreference(v)} />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Building className="w-4 h-4 text-gray-400" /> Preferred accommodation
                    </label>
                    <ChipSelector options={ACCOMMODATION_OPTIONS} selected={settings.travelPrefs.accommodationTypes} onToggle={(v) => settings.toggleAccommodationType(v)} />
                  </div>

                  <FieldGroup label="Accessibility / mobility needs">
                    <SettingsInput
                      value={settings.travelPrefs.accessibilityNeeds}
                      onChange={(v) => settings.setTravelPref("accessibilityNeeds", v)}
                      placeholder="e.g. wheelchair accessible, limited mobility..."
                    />
                  </FieldGroup>
                </div>
              </SettingsCard>
            )}

            {/* ────── SUBSCRIPTION ────── */}
            {activeSection === "subscription" && (
              <SettingsCard title="Subscription" subtitle="Manage your plan and billing" icon={<CreditCard className="w-5 h-5 text-amber-500" />} color="bg-amber-50 dark:bg-amber-900/20">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {auth.isPro ? "Friendinerary Pro" : "Free Plan"}
                        </p>
                        {auth.isPro && (
                          <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                            <Crown className="w-3 h-3" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {auth.isPro
                          ? "Full access to all features including AI, route optimization, and offline access"
                          : "Basic features with limited AI messages and no route optimization"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {auth.isPro ? (
                      <button
                        onClick={handleManageSubscription}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        Manage billing
                      </button>
                    ) : (
                      <a
                        href="/pro"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Pro
                      </a>
                    )}
                  </div>
                </div>

                {!auth.isPro && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      "Unlimited AI messages",
                      "Route optimization",
                      "Gmail import",
                      "Offline access",
                      "Google Maps export",
                      "Dark mode on mobile",
                      "Price alerts",
                      "Priority support",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </SettingsCard>
            )}

            {/* ────── DATA & EXPORT ────── */}
            {activeSection === "data" && (
              <SettingsCard title="Data & Export" subtitle="Export, import, or delete your data" icon={<Download className="w-5 h-5 text-cyan-500" />} color="bg-cyan-50 dark:bg-cyan-900/20">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Export all data</h3>
                    <p className="text-xs text-gray-400 mb-3">Download all your trips, preferences, and account data as JSON</p>
                    <button onClick={handleExportData} className="text-sm font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      <Download className="w-4 h-4" /> Export data
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Import trips</h3>
                    <p className="text-xs text-gray-400 mb-3">Import trips from TripIt, Google Trips, or a JSON file</p>
                    <button className="text-sm font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1">
                      <Download className="w-4 h-4 rotate-180" /> Import data
                    </button>
                  </div>

                  {/* Danger zone */}
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
                      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Delete account
                      </h3>
                      <p className="text-xs text-red-500/70 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                        Your data will be fully removed within 14 days.
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          className="w-40 px-3 py-2 border-2 border-red-200 rounded-xl text-sm placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder='Type "DELETE"'
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                        />
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirm !== "DELETE"}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Delete account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsCard>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
});

/* ─── Reusable sub-components ─── */

function SettingsCard({ title, subtitle, icon, color, children }: {
  title: string; subtitle: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SettingsInput({ value, onChange, placeholder, disabled }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      className={`w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
        disabled ? "bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-white dark:bg-gray-900"
      }`}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function PasswordInput({ value, onChange, show, toggle, placeholder }: {
  value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
      />
      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" /> }
      </button>
    </div>
  );
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {saving ? "Saving..." : "Save changes"}
    </button>
  );
}

function SettingsRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="text-gray-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}

function ConnectionRow({ name, desc, connected, onToggle, icon }: {
  name: string; desc: string; connected: boolean; onToggle: () => void; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
          connected
            ? "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
            : "text-brand-500 bg-orange-50 hover:bg-orange-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/30"
        }`}
      >
        {connected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}

function ChipSelector({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              isSelected
                ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default SettingsPage;
