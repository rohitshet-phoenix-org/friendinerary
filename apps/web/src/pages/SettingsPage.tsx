import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import AppLayout from "../components/ui/AppLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { User, Lock, Bell, CreditCard } from "lucide-react";

const SettingsPage = observer(() => {
  const { auth } = useStore();
  const [displayName, setDisplayName] = useState(auth.user?.displayName ?? "");
  const [saving, setSaving] = useState(false);

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

  const handleManageSubscription = async () => {
    try {
      const { data } = await api.get<{ data: { portalUrl: string } }>("/subscriptions/portal");
      window.location.href = data.data.portalUrl;
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

        {/* Profile */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
              <input type="text" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" className="input bg-gray-50" value={auth.user?.email ?? ""} disabled />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        {/* Subscription */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Subscription</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {auth.isPro ? "Friendinerary Pro" : "Free plan"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {auth.isPro ? "Full access to all features" : "Upgrade to unlock Pro features"}
              </p>
            </div>
            {auth.isPro ? (
              <button onClick={handleManageSubscription} className="btn-secondary text-sm">Manage</button>
            ) : (
              <a href="/pro" className="btn-primary text-sm">Upgrade to Pro</a>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
});

export default SettingsPage;
