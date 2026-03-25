import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../stores/RootStore";
import { api } from "../lib/api";
import { MapPin, Check, Crown } from "lucide-react";
import toast from "react-hot-toast";

const PRO_FEATURES = [
  "Route optimizer (up to 15 places/day)",
  "Gmail auto-import for reservations",
  "Export itinerary to Google Maps",
  "Unlimited AI Assistant messages",
  "Offline access (mobile)",
  "Offline map downloads",
  "Hotel price drop alerts",
  "Unlimited file attachments",
];

export default function ProPage() {
  const { auth } = useStore();
  const [interval, setInterval] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!auth.isAuthenticated) {
      window.location.href = "/signup";
      return;
    }
    setLoading(true);
    try {
      const priceId = interval === "annual"
        ? import.meta.env["VITE_STRIPE_PRO_ANNUAL_PRICE_ID"]
        : import.meta.env["VITE_STRIPE_PRO_MONTHLY_PRICE_ID"];

      const { data } = await api.post<{ data: { checkoutUrl: string } }>("/subscriptions/checkout", {
        priceId,
        interval,
      });
      window.location.href = data.data.checkoutUrl;
    } catch {
      toast.error("Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <MapPin className="w-7 h-7 text-brand-500" />
        <span className="text-xl font-bold text-gray-900">Friendinerary</span>
      </Link>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" /> Friendinerary Pro
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Unlock the full experience</h1>
          <p className="text-gray-500 mt-2">Everything you need for perfect trips.</p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${interval === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
          >
            Monthly · $4.99
          </button>
          <button
            onClick={() => setInterval("annual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${interval === "annual" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
          >
            Annual · $29.99
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Save 50%</span>
          </button>
        </div>

        <div className="card p-6 mb-4">
          <ul className="space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {auth.isPro ? (
          <div className="text-center py-3 bg-green-50 rounded-xl text-green-700 font-medium">
            ✓ You're already on Pro!
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? "Redirecting..." : `Upgrade to Pro — ${interval === "annual" ? "$29.99/year" : "$4.99/month"}`}
          </button>
        )}

        <p className="text-center text-xs text-gray-400 mt-3">
          Cancel anytime. No lock-in.
        </p>
      </div>
    </div>
  );
}
