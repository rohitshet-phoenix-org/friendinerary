import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <MapPin className="w-16 h-16 text-gray-200" />
      <h1 className="text-3xl font-bold text-gray-700">404 — Page not found</h1>
      <p className="text-gray-400">This destination doesn't exist on our map.</p>
      <Link to="/dashboard" className="btn-primary mt-2">Back to dashboard</Link>
    </div>
  );
}
